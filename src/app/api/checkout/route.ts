import { fail, json, readJson } from '@/lib/http';
import { getProductById } from '@/lib/repo/products';
import { StockError, createOrder, updateOrder } from '@/lib/repo/orders';
import { getSettings } from '@/lib/settings';
import { createStripeSession } from '@/lib/payments';
import { ValidationError, optionalString, requireArray, requireEmail, requireOneOf, requireString } from '@/lib/validate';
import type { Address, OrderItem } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await readJson<Record<string, any>>(request);
  const settings = getSettings();

  try {
    const rawItems = requireArray<{ productId?: string; quantity?: number }>(body.items, 'Cart');
    if (rawItems.length === 0) throw new ValidationError('Your cart is empty.');
    if (rawItems.length > 50) throw new ValidationError('Too many line items in one order.');

    const items: OrderItem[] = [];
    for (const raw of rawItems) {
      const product = getProductById(String(raw.productId ?? ''));
      if (!product || product.status !== 'active') throw new ValidationError('One of the products is no longer available.');
      const quantity = Math.round(Number(raw.quantity ?? 0));
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        throw new ValidationError(`Invalid quantity for ${product.name}.`);
      }
      items.push({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: product.images[0] ?? '',
        priceCents: product.priceCents,
        quantity,
      });
    }

    const subtotalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

    const provider = requireOneOf(body.paymentProvider, ['cod', 'bank', 'stripe'] as const, 'Payment method');
    const providerSettings = settings.payments[provider];
    if (!providerSettings?.enabled) throw new ValidationError('That payment method is not available right now.');

    const shippingCents =
      settings.freeShippingThresholdCents > 0 && subtotalCents >= settings.freeShippingThresholdCents
        ? 0
        : settings.flatShippingCents;
    const taxCents = Math.round((subtotalCents * settings.taxRateBp) / 10000);
    const totalCents = subtotalCents + shippingCents + taxCents;

    const address: Address = {
      line1: requireString(body.address?.line1, 'Address line 1', { max: 200 }),
      line2: optionalString(body.address?.line2, { max: 200 }),
      city: requireString(body.address?.city, 'City', { max: 100 }),
      region: optionalString(body.address?.region, { max: 100 }),
      postalCode: requireString(body.address?.postalCode, 'Postal code', { max: 30 }),
      country: requireString(body.address?.country, 'Country', { max: 80 }),
    };

    const order = createOrder({
      email: requireEmail(body.email),
      name: requireString(body.name, 'Full name', { max: 120 }),
      phone: optionalString(body.phone, { max: 40 }),
      address,
      items,
      subtotalCents,
      shippingCents,
      taxCents,
      totalCents,
      currency: settings.currency,
      paymentProvider: provider,
      paymentStatus: provider === 'cod' ? 'unpaid' : 'pending',
      notes: optionalString(body.notes, { max: 1000 }),
    });

    if (provider === 'stripe') {
      try {
        const url = await createStripeSession(order, settings);
        updateOrder(order.id, { paymentRef: url ? `pending:${order.number}` : '' });
        return json({ data: { orderNumber: order.number, redirectUrl: url } }, 201);
      } catch (error) {
        // Release the reserved stock: the customer never reached the payment page.
        updateOrder(order.id, { status: 'cancelled', notes: `Stripe error: ${(error as Error).message}` });
        return fail((error as Error).message || 'Payment provider is unavailable.', 502);
      }
    }

    return json({ data: { orderNumber: order.number, redirectUrl: `/checkout/success?order=${order.number}` } }, 201);
  } catch (error) {
    if (error instanceof ValidationError) return fail(error.message, 422);
    if (error instanceof StockError) return fail(error.message, 409);
    console.error('[checkout]', error);
    return fail('Something went wrong placing the order. No payment was taken.', 500);
  }
}
