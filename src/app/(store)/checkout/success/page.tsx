import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CheckCircle2, Package, Truck } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { retrieveStripeSession } from '@/lib/payments';
import { getOrderByNumber, markPaid } from '@/lib/repo/orders';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Order confirmed' };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; session_id?: string; stripe?: string }>;
}) {
  const params = await searchParams;
  const orderNumber = params.order?.trim();
  if (!orderNumber) redirect('/');

  const settings = getSettings();
  let order = getOrderByNumber(orderNumber);
  if (!order) notFound();

  if (order.paymentStatus !== 'paid' && params.session_id && settings.payments.stripe.secretKey) {
    const session = await retrieveStripeSession(params.session_id, settings.payments.stripe.secretKey);
    if (session?.payment_status === 'paid' && session?.metadata?.order_id === order.id) {
      order = markPaid(order.id, String(session.id)) ?? order;
    }
  }

  const provider = settings.payments[order.paymentProvider as keyof typeof settings.payments];
  const isPaid = order.paymentStatus === 'paid';
  const providerLabel = provider?.label ?? order.paymentProvider;

  return (
    <div className="shell py-14 lg:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3 text-accent">
          <CheckCircle2 className="h-5 w-5" strokeWidth={1.6} />
          <p className="text-[11px] uppercase tracking-[0.2em]">Order {order.number}</p>
        </div>
        <h1 className="mt-5 text-[clamp(2.1rem,4vw,3.2rem)] leading-[1.02] tracking-[-0.035em] text-balance">
          Thank you, {order.name.split(' ')[0]}.
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-graphite">
          {isPaid
            ? `Payment received. We are packing your order now and will email tracking to ${order.email} within two business days.`
            : `Your order is reserved. Complete payment via ${providerLabel.toLowerCase()} and we will ship as soon as it clears. A confirmation is on its way to ${order.email}.`}
        </p>

        {!isPaid && provider?.instructions ? (
          <div className="mt-8 rounded-sm border border-hairline bg-white/60 p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-graphite">Payment instructions</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-graphite">{provider.instructions}</p>
            {provider.details ? (
              <p className="mt-3 whitespace-pre-line rounded-sm bg-parchment/70 px-3 py-2.5 text-[12.5px] leading-relaxed text-ink">
                {provider.details}
              </p>
            ) : null}
            {order.paymentProvider === 'bank' ? (
              <p className="mt-3 text-[12px] text-muted">Always include order {order.number} as the reference.</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-graphite">Items</p>
            <ul className="mt-4 space-y-3">
              {order.items.map((item) => (
                <li key={`${item.productId}-${item.name}`} className="flex items-center gap-3">
                  {item.image ? (
                    <img src={item.image} alt="" className="h-14 w-11 rounded-sm bg-parchment object-cover" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px]">{item.name}</p>
                    <p className="text-[12px] text-muted">Qty {item.quantity}</p>
                  </div>
                  <p className="text-[13px] tabular-nums">{formatMoney(item.priceCents * item.quantity, order.currency)}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-graphite">Shipping to</p>
            <address className="mt-4 not-italic text-[13.5px] leading-relaxed text-graphite">
              {order.name}
              <br />
              {order.address.line1}
              {order.address.line2 ? (
                <>
                  <br />
                  {order.address.line2}
                </>
              ) : null}
              <br />
              {order.address.city}
              {order.address.region ? `, ${order.address.region}` : ''} {order.address.postalCode}
              <br />
              {order.address.country}
            </address>
            <p className="mt-4 text-[12px] text-muted">{order.email}</p>
            {order.phone ? <p className="text-[12px] text-muted">{order.phone}</p> : null}
          </div>
        </div>

        <dl className="mt-10 space-y-2.5 border-t border-hairline pt-6 text-[13.5px]">
          <div className="flex justify-between">
            <dt className="text-graphite">Subtotal</dt>
            <dd className="tabular-nums">{formatMoney(order.subtotalCents, order.currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-graphite">Shipping</dt>
            <dd className="tabular-nums">{order.shippingCents === 0 ? 'Free' : formatMoney(order.shippingCents, order.currency)}</dd>
          </div>
          {order.taxCents > 0 ? (
            <div className="flex justify-between">
              <dt className="text-graphite">Tax</dt>
              <dd className="tabular-nums">{formatMoney(order.taxCents, order.currency)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-hairline pt-3 text-[15px]">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatMoney(order.totalCents, order.currency)}</dd>
          </div>
        </dl>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Package, title: 'Packed by hand', body: 'Paper and wool, no plastic.' },
            { icon: Truck, title: 'Two-day dispatch', body: 'Tracking lands in your inbox.' },
            { icon: CheckCircle2, title: 'Repairs for life', body: 'Send it back whenever.' },
          ].map((step) => (
            <div key={step.title} className="rounded-sm border border-hairline px-4 py-4">
              <step.icon className="h-4 w-4 text-accent" strokeWidth={1.6} />
              <p className="mt-3 text-[13px] text-ink">{step.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-6">
          <Link
            href="/products"
            className="inline-flex rounded-full bg-ink px-7 py-3.5 text-[12px] uppercase tracking-[0.16em] text-paper transition hover:bg-accent"
          >
            Keep shopping
          </Link>
          <Link href="/contact" className="text-[12.5px] uppercase tracking-[0.12em] text-graphite hover:text-ink">
            Questions about this order
          </Link>
        </div>
      </div>
    </div>
  );
}
