import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, MapPin, Phone } from 'lucide-react';
import { Badge, Card, PageHeader, statusTone } from '@/components/admin/ui';
import { OrderPanel } from '@/components/admin/order-panel';
import { requireUser } from '@/lib/auth';
import { formatMoney } from '@/lib/money';
import { getOrderById } from '@/lib/repo/orders';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const order = getOrderById(id);
  if (!order) notFound();
  const settings = getSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={`Order ${order.number}`}
        title={formatMoney(order.totalCents, order.currency)}
        description={`Placed ${new Date(order.createdAt).toLocaleString('en-US')} · ${order.items.length} line ${
          order.items.length === 1 ? 'item' : 'items'
        }`}
        actions={
          <>
            <Badge tone={statusTone(order.status)}>{order.status}</Badge>
            <Badge tone={statusTone(order.paymentStatus)}>{order.paymentStatus}</Badge>
            <Link href="/admin/orders" className="ml-1 inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.1em] text-graphite hover:text-ink">
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
              All orders
            </Link>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Card title="Items" bodyClassName="p-0">
            <ul className="divide-y divide-hairline">
              {order.items.map((item) => (
                <li key={`${item.productId}-${item.name}`} className="flex items-center gap-4 px-5 py-4">
                  {item.image ? (
                    <img src={item.image} alt="" className="h-14 w-11 rounded-sm bg-parchment object-cover" />
                  ) : (
                    <div className="h-14 w-11 rounded-sm bg-parchment" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${item.productId}`} className="block truncate text-[13.5px] hover:text-accent">
                      {item.name}
                    </Link>
                    <p className="text-[11.5px] text-muted">
                      {item.quantity} × {formatMoney(item.priceCents, order.currency)}
                    </p>
                  </div>
                  <p className="text-[13.5px] tabular-nums">{formatMoney(item.priceCents * item.quantity, order.currency)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2.5 border-t border-hairline px-5 py-4 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-graphite">Subtotal</dt>
                <dd className="tabular-nums">{formatMoney(order.subtotalCents, order.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-graphite">Shipping</dt>
                <dd className="tabular-nums">{formatMoney(order.shippingCents, order.currency)}</dd>
              </div>
              {order.taxCents > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-graphite">Tax</dt>
                  <dd className="tabular-nums">{formatMoney(order.taxCents, order.currency)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-hairline pt-2.5 text-[14px]">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatMoney(order.totalCents, order.currency)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Customer">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-[13.5px] text-ink">{order.name}</p>
                <p className="mt-2 flex items-center gap-2 text-[12.5px] text-graphite">
                  <Mail className="h-3.5 w-3.5" strokeWidth={1.6} />
                  <a href={`mailto:${order.email}`} className="break-all hover:text-ink">
                    {order.email}
                  </a>
                </p>
                {order.phone ? (
                  <p className="mt-1.5 flex items-center gap-2 text-[12.5px] text-graphite">
                    <Phone className="h-3.5 w-3.5" strokeWidth={1.6} />
                    {order.phone}
                  </p>
                ) : null}
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.12em] text-muted">
                  <MapPin className="h-3 w-3" strokeWidth={1.6} /> Shipping address
                </p>
                <address className="mt-2 not-italic text-[12.5px] leading-relaxed text-graphite">
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
              </div>
            </div>
          </Card>

          {order.notes ? (
            <Card title="Customer note">
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-graphite">{order.notes}</p>
            </Card>
          ) : null}
        </div>

        <OrderPanel
          order={{
            id: order.id,
            number: order.number,
            status: order.status,
            paymentStatus: order.paymentStatus,
            paymentProvider: order.paymentProvider,
            paymentRef: order.paymentRef,
            notes: order.notes,
          }}
          providerLabel={
            settings.payments[order.paymentProvider as keyof typeof settings.payments]?.label ?? order.paymentProvider
          }
        />
      </div>
    </div>
  );
}
