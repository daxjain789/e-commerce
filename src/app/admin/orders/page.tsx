import Link from 'next/link';
import { Search } from 'lucide-react';
import { Badge, Card, EmptyState, PageHeader, statusTone } from '@/components/admin/ui';
import { requireUser } from '@/lib/auth';
import { formatMoney } from '@/lib/money';
import { listOrders } from '@/lib/repo/orders';
import type { OrderStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

const TABS: { id: OrderStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'paid', label: 'Paid' },
  { id: 'fulfilled', label: 'Fulfilled' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const status = (TABS.find((tab) => tab.id === params.status)?.id ?? 'all') as OrderStatus | 'all';
  const q = (params.q ?? '').trim();
  const orders = listOrders({ status, search: q || undefined, limit: 200 });

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Operations"
        title="Orders"
        description="Payment state and fulfilment for every order. Cancelling an order returns its stock automatically."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-md border border-hairline bg-white p-1 text-[12px]">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={`/admin/orders${tab.id === 'all' ? '' : `?status=${tab.id}`}`}
              className={
                status === tab.id
                  ? 'rounded bg-ink px-3 py-1.5 text-paper'
                  : 'rounded px-3 py-1.5 text-graphite transition hover:bg-ink/5'
              }
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <form action="/admin/orders" className="relative flex items-center">
          {status !== 'all' ? <input type="hidden" name="status" value={status} /> : null}
          <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted" strokeWidth={1.6} />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Order number, name or email"
            aria-label="Search orders"
            className="w-[260px] rounded-md border border-hairline bg-white py-2 pl-8 pr-3 text-[13px] outline-none transition focus:border-ink/40"
          />
        </form>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title={q ? `No orders match “${q}”` : 'No orders in this view'}
          description="Orders appear here the moment a customer checks out."
        />
      ) : (
        <Card bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-hairline text-[10.5px] uppercase tracking-[0.1em] text-muted">
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-3 py-3 font-semibold">Placed</th>
                  <th className="px-3 py-3 font-semibold">Customer</th>
                  <th className="px-3 py-3 font-semibold">Items</th>
                  <th className="px-3 py-3 font-semibold">Total</th>
                  <th className="px-3 py-3 font-semibold">Payment</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {orders.map((order) => (
                  <tr key={order.id} className="transition hover:bg-ink/[0.02]">
                    <td className="px-5 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium hover:text-accent">
                        {order.number}
                      </Link>
                      <p className="text-[11px] text-muted">{order.paymentProvider}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-graphite">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="max-w-[180px] px-3 py-3">
                      <p className="truncate">{order.name}</p>
                      <p className="truncate text-[11px] text-muted">{order.email}</p>
                    </td>
                    <td className="px-3 py-3 text-graphite">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                    <td className="px-3 py-3 tabular-nums">{formatMoney(order.totalCents, order.currency)}</td>
                    <td className="px-3 py-3">
                      <Badge tone={statusTone(order.paymentStatus)}>{order.paymentStatus}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone(order.status)}>{order.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
