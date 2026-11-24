import Link from 'next/link';
import { Card, PageHeader } from '@/components/admin/ui';
import { InventoryTable } from '@/components/admin/inventory-table';
import { requireUser } from '@/lib/auth';
import { all } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { listProducts, stockValueCents } from '@/lib/repo/products';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function AdminInventoryPage() {
  await requireUser();
  const settings = getSettings();
  const products = listProducts({ status: 'all', sort: 'stock', limit: 500 });
  const stockValue = stockValueCents();
  const units = products.reduce((sum, product) => sum + Math.max(product.stock, 0), 0);

  const movements = all<{
    id: string;
    delta: number;
    reason: string;
    created_at: string;
    product_name: string;
    product_id: string;
  }>(
    `SELECT m.id, m.delta, m.reason, m.created_at, m.product_id, p.name AS product_name
       FROM stock_movements m JOIN products p ON p.id = m.product_id
      ORDER BY m.created_at DESC LIMIT 40`,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Operations"
        title="Inventory"
        description="Adjust stock by hand and see every movement — sales, cancellations and edits are all logged."
        actions={
          <div className="rounded-md border border-hairline bg-white px-4 py-2 text-[12px] text-graphite">
            <span className="uppercase tracking-[0.1em] text-muted">Stock value</span>
            <span className="ml-2 font-medium text-ink">{formatMoney(stockValue, settings.currency)}</span>
            <span className="ml-3 uppercase tracking-[0.1em] text-muted">Units</span>
            <span className="ml-2 font-medium text-ink">{units}</span>
          </div>
        }
      />

      <InventoryTable
        currency={settings.currency}
        products={products.map((product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          stock: product.stock,
          priceCents: product.priceCents,
          status: product.status,
          image: product.images[0] ?? '',
        }))}
      />

      <Card title="Stock ledger" description="The last forty movements across the catalogue." bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-hairline text-[10.5px] uppercase tracking-[0.1em] text-muted">
                <th className="px-5 py-2.5 font-semibold">When</th>
                <th className="px-3 py-2.5 font-semibold">Product</th>
                <th className="px-3 py-2.5 font-semibold">Change</th>
                <th className="px-5 py-2.5 font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-graphite">
                    No movements recorded yet.
                  </td>
                </tr>
              ) : null}
              {movements.map((movement) => (
                <tr key={movement.id}>
                  <td className="whitespace-nowrap px-5 py-2.5 text-muted">
                    {new Date(movement.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/products/${movement.product_id}`} className="hover:text-accent">
                      {movement.product_name}
                    </Link>
                  </td>
                  <td className={`px-3 py-2.5 tabular-nums ${movement.delta > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {movement.delta > 0 ? `+${movement.delta}` : movement.delta}
                  </td>
                  <td className="px-5 py-2.5 text-graphite">{movement.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
