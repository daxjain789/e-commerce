import { fail, json } from '@/lib/http';
import { getSettings } from '@/lib/settings';
import { verifyStripeSignature } from '@/lib/payments';
import { getOrderById, getOrderByNumber, markPaid, updateOrder } from '@/lib/repo/orders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stripe webhook endpoint. Configure it in the Stripe dashboard:
 *   https://your-domain/api/payments/stripe/webhook
 * Events: checkout.session.completed, checkout.session.expired,
 *         payment_intent.payment_failed
 */
export async function POST(request: Request) {
  const settings = getSettings();
  const secret = settings.payments.stripe.webhookSecret;
  if (!secret) return fail('Stripe webhooks are not configured.', 503);

  const raw = await request.text();
  const event = verifyStripeSignature(raw, request.headers.get('stripe-signature'), secret);
  if (!event) return fail('Invalid webhook signature.', 400);

  const session = event?.data?.object ?? {};
  const orderId = session?.metadata?.order_id as string | undefined;
  const orderNumber = session?.metadata?.order_number ?? session?.client_reference_id;
  const order = orderId ? getOrderById(orderId) : orderNumber ? getOrderByNumber(String(orderNumber)) : null;

  switch (event.type) {
    case 'checkout.session.completed': {
      if (order && (session.payment_status === 'paid' || session.payment_status === 'no_payment_required')) {
        markPaid(order.id, String(session.id ?? ''));
      }
      break;
    }
    case 'checkout.session.expired':
    case 'payment_intent.payment_failed': {
      if (order && order.paymentStatus !== 'paid') {
        updateOrder(order.id, { paymentStatus: 'failed' });
      }
      break;
    }
    default:
      break;
  }

  return json({ received: true });
}
