import Link from 'next/link';
import { ArrowUpRight, Boxes, Package, ReceiptText, TrendingUp } from 'lucide-react';
import { Badge, Card, PageHeader, StatCard, statusTone } from '@/components/admin/ui';
import { requireUser } from '@/lib/auth';
import { formatMoney } from '@/lib/money';
import { listPages } from '@/lib/repo/pages';
import { countProducts, lowStockProducts, stockValueCents } from '@/lib/repo/products';
import { orderStats, recentOrders } from '@/lib/repo/orders';
import { getSettings } from '@/lib/settings';
import { adminButtonPrimary } from '@/lib/ui';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  await requireUser();
  const settings = getSettings();
  const stats = orderStats();
  const orders = recentOrders(5);
  const lowStock = lowStockProducts(5);
  const productCount = countProducts({ status: 'all' });
  const pages = listPages();
  const stockValue = stockValueCents();
  const stripeReady = Boolean(settings.payments.stripe.enabled && settings.payments.stripe.secretKey);

  return (
    <div className="space-y-7">
      <PageHeader
        kicker="Overview"
        title="How the shop is doing"
        description="Live numbers from the storefront. Everything here is editable in the store admin."
        actions={
          <>
            <Link href="/admin/products/new" className={adminButtonPrimary}>
              <Package className="h-4 w-4" strokeWidth={1.8} />
              New product
            </Link>
            <Link href="/" target="_blank" className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-white px-4 py-2 text-sm text-ink transition hover:border-ink/30">
              View store
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue (paid)"
          value={formatMoney(stats.revenueCents, settings.currency)}
          hint={`${stats.paidOrders} paid ${stats.paidOrders === 1 ? 'order' : 'orders'}`}
        />
        <StatCard label="Orders" value={String(stats.totalOrders)} hint={`${stats.pendingOrders} awaiting action`} href="/admin/orders" />
        <StatCard
          label="Average order"
          value={formatMoney(stats.averageOrderCents, settings.currency)}
          hint={`${stats.unitsSold} units sold`}
        />
        <StatCard label="Stock value" value={formatMoney(stockValue, settings.currency)} hint={`${productCount} products`} href="/admin/inventory" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Card
          title="Recent orders"
          description="The last five orders across every channel."
          actions={
            <Link href="/admin/orders" className="text-[12px] uppercase tracking-[0.1em] text-graphite hover:text-ink">
              All orders
            </Link>
          }
          bodyClassName="p-0"
        >
          {orders.length === 0 ? (
            <div className="px-5 py-12 text-center text-[13px] text-graphite">
              No orders yet. Place a test order from the storefront to see it here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-hairline text-[10.5px] uppercase tracking-[0.1em] text-muted">
                    <th className="px-5 py-2.5 font-semibold">Order</th>
                    <th className="px-3 py-2.5 font-semibold">Customer</th>
                    <th className="px-3 py-2.5 font-semibold">Total</th>
                    <th className="px-3 py-2.5 font-semibold">Payment</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {orders.map((order) => (
                    <tr key={order.id} className="transition hover:bg-ink/[0.02]">
                      <td className="px-5 py-3">
                        <Link href={`/admin/orders/${order.id}`} className="font-medium hover:text-accent">
                          {order.number}
                        </Link>
                        <p className="text-[11px] text-muted">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </td>
                      <td className="max-w-[160px] px-3 py-3">
                        <p className="truncate">{order.name}</p>
                        <p className="truncate text-[11px] text-muted">{order.email}</p>
                      </td>
                      <td className="px-3 py-3 tabular-nums">{formatMoney(order.totalCents, order.currency)}</td>
                      <td className="px-3 py-3">
                        <Badge tone={statusTone(order.paymentStatus)}>{order.paymentStatus}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Badge tone={statusTone(order.status)}>{order.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card
            title="Low stock"
            description="Active products at or below five units."
            actions={
              <Link href="/admin/inventory" className="text-[12px] uppercase tracking-[0.1em] text-graphite hover:text-ink">
                Manage
              </Link>
            }
          >
            {lowStock.length === 0 ? (
              <p className="text-[13px] text-graphite">Every active product has more than five units. Nothing to do.</p>
            ) : (
              <ul className="space-y-3">
                {lowStock.slice(0, 5).map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-3">
                    <Link href={`/admin/products/${product.id}`} className="min-w-0 truncate text-[13px] hover:text-accent">
                      {product.name}
                    </Link>
                    <Badge tone={product.stock === 0 ? 'danger' : 'warning'} className="normal-case">
                        {product.stock} left
                      </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Store health" description="A quick read on what is configured.">
            <ul className="space-y-3 text-[12.5px]">
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-graphite">
                  <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.6} /> Stripe checkout
                </span>
                <Badge tone={stripeReady ? 'success' : 'neutral'}>{stripeReady ? 'Live' : 'Not configured'}</Badge>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-graphite">
                  <ReceiptText className="h-3.5 w-3.5" strokeWidth={1.6} /> Manual payments
                </span>
                <Badge
                  className="normal-case"
                  tone={settings.payments.cod.enabled || settings.payments.bank.enabled ? 'success' : 'warning'}
                >
                  {[settings.payments.cod.enabled ? 'COD' : null, settings.payments.bank.enabled ? 'Bank' : null]
                    .filter(Boolean)
                    .join(' + ') || 'Off'}
                </Badge>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-graphite">
                  <Boxes className="h-3.5 w-3.5" strokeWidth={1.6} /> CMS pages
                </span>
                <Badge tone="neutral" className="normal-case">
                  {pages.length} live
                </Badge>
              </li>
            </ul>
            <Link href="/admin/settings" className="mt-4 inline-flex text-[12px] uppercase tracking-[0.1em] text-graphite hover:text-ink">
              Open settings →
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
