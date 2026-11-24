import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { Badge, Card, EmptyState, PageHeader, statusTone } from '@/components/admin/ui';
import { DeleteButton } from '@/components/admin/delete-button';
import { requireUser } from '@/lib/auth';
import { formatMoney } from '@/lib/money';
import { listProducts } from '@/lib/repo/products';
import { getSettings } from '@/lib/settings';
import { adminButtonPrimary } from '@/lib/ui';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const settings = getSettings();
  const q = (params.q ?? '').trim();
  const status = params.status === 'draft' || params.status === 'active' ? params.status : ('all' as const);
  const products = listProducts({ search: q || undefined, status, sort: 'name', limit: 500 });

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Catalogue"
        title="Products"
        description="Prices, stock, imagery and descriptions. Changes appear on the storefront immediately."
        actions={
          <Link href="/admin/products/new" className={adminButtonPrimary}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            New product
          </Link>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <form action="/admin/products" className="relative flex items-center">
          {status !== 'all' ? <input type="hidden" name="status" value={status} /> : null}
          <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted" strokeWidth={1.6} />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name, SKU or description"
            aria-label="Search products"
            className="w-[260px] rounded-md border border-hairline bg-white py-2 pl-8 pr-3 text-[13px] outline-none transition focus:border-ink/40"
          />
        </form>

        <div className="flex gap-1 rounded-md border border-hairline bg-white p-1 text-[12px]">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'draft', label: 'Drafts' },
          ].map((tab) => (
            <Link
              key={tab.id}
              href={`/admin/products${tab.id === 'all' ? '' : `?status=${tab.id}`}`}
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
      </div>

      {products.length === 0 ? (
        <EmptyState
          title={q ? `No products match “${q}”` : 'No products yet'}
          description="Add your first product and it will appear on the storefront immediately."
          action={
            <Link href="/admin/products/new" className={adminButtonPrimary}>
              Create a product
            </Link>
          }
        />
      ) : (
        <Card bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-hairline text-[10.5px] uppercase tracking-[0.1em] text-muted">
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-3 py-3 font-semibold">Category</th>
                  <th className="px-3 py-3 font-semibold">Price</th>
                  <th className="px-3 py-3 font-semibold">Stock</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {products.map((product) => (
                  <tr key={product.id} className="transition hover:bg-ink/[0.02]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {product.images[0] ? (
                          <img src={product.images[0]} alt="" className="h-11 w-9 rounded-sm bg-parchment object-cover" />
                        ) : (
                          <div className="h-11 w-9 rounded-sm bg-parchment" />
                        )}
                        <div className="min-w-0 max-w-[260px]">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="line-clamp-2 font-medium text-ink hover:text-accent wrap-anywhere"
                          >
                            {product.name}
                          </Link>
                          <p className="truncate text-[11px] text-muted">{product.sku || 'No SKU'} · /{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-graphite">{product.categoryName ?? '—'}</td>
                    <td className="px-3 py-3 tabular-nums">
                      {formatMoney(product.priceCents, settings.currency)}
                      {product.compareAtCents ? (
                        <span className="ml-1 text-[11px] text-muted line-through">
                          {formatMoney(product.compareAtCents, settings.currency)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <Badge
                        tone={product.stock === 0 ? 'danger' : product.stock <= 5 ? 'warning' : 'neutral'}
                        className="normal-case"
                      >
                        {product.stock} in stock
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={statusTone(product.status)}>{product.status}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <Link href={`/admin/products/${product.id}`} className="text-[12px] text-graphite hover:text-ink">
                          Edit
                        </Link>
                        <Link
                          href={`/products/${product.slug}`}
                          target="_blank"
                          className="text-[12px] text-graphite hover:text-ink"
                        >
                          View
                        </Link>
                        <DeleteButton endpoint={`/api/products/${product.id}`} label="Delete" />
                      </div>
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
