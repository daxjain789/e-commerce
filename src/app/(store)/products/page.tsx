import type { Metadata } from 'next';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { ProductCard } from '@/components/store/product-card';
import { listCategories } from '@/lib/repo/categories';
import { countProducts, listProducts } from '@/lib/repo/products';
import { getSettings } from '@/lib/settings';
import { cn } from '@/lib/ui';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shop all products',
  description: 'The full catalogue — every object we currently make or stock.',
};

const SORTS = [
  { id: 'newest', label: 'Newest' },
  { id: 'price-asc', label: 'Price ↑' },
  { id: 'price-desc', label: 'Price ↓' },
  { id: 'name', label: 'A–Z' },
] as const;

type SortId = (typeof SORTS)[number]['id'];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const settings = getSettings();
  const q = (params.q ?? '').trim();
  const category = params.category ?? '';
  const sort = (SORTS.find((s) => s.id === params.sort)?.id ?? 'newest') as SortId;

  const categories = listCategories();
  const products = listProducts({ search: q || undefined, categorySlug: category || undefined, status: 'active', sort });
  const total = countProducts({ status: 'active' });
  const activeCategory = categories.find((c) => c.slug === category);

  const buildHref = (next: { category?: string; sort?: string; q?: string }) => {
    const search = new URLSearchParams();
    const nextQ = next.q ?? q;
    const nextCategory = next.category ?? category;
    const nextSort = next.sort ?? sort;
    if (nextQ) search.set('q', nextQ);
    if (nextCategory) search.set('category', nextCategory);
    if (nextSort && nextSort !== 'newest') search.set('sort', nextSort);
    const query = search.toString();
    return query ? `/products?${query}` : '/products';
  };

  return (
    <div className="shell py-12 lg:py-16">
      <div className="max-w-2xl">
        <p className="eyebrow">The catalogue</p>
        <h1 className="mt-4 text-[clamp(2.2rem,4vw,3.4rem)] leading-[1.02] tracking-[-0.035em]">
          {activeCategory ? activeCategory.name : 'Everything we make'}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-graphite">
          {activeCategory?.description ||
            'Short runs from workshops we visit in person. When something sells out it is usually gone for a season.'}
        </p>
      </div>

      <div className="mt-10 space-y-4 border-y border-hairline py-5">
        <nav className="-mx-1 flex flex-wrap items-center gap-1" aria-label="Categories">
          <Link
            href={buildHref({ category: '' })}
            className={cn(
              'whitespace-nowrap rounded-full px-4 py-2 text-[12px] uppercase tracking-[0.12em] transition',
              !category ? 'bg-ink text-paper' : 'text-graphite hover:bg-ink/5 hover:text-ink',
            )}
          >
            All ({total})
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={buildHref({ category: c.slug })}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-2 text-[12px] uppercase tracking-[0.12em] transition',
                category === c.slug ? 'bg-ink text-paper' : 'text-graphite hover:bg-ink/5 hover:text-ink',
              )}
            >
              {c.name} ({c.productCount})
            </Link>
          ))}
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <form action="/products" className="relative flex items-center">
            {category ? <input type="hidden" name="category" value={category} /> : null}
            {sort !== 'newest' ? <input type="hidden" name="sort" value={sort} /> : null}
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted" strokeWidth={1.6} />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search the shop"
              aria-label="Search products"
              className="w-full min-w-[190px] rounded-full border border-hairline bg-white/60 py-2 pl-8 pr-3 text-[13px] outline-none transition focus:border-ink/40 sm:w-64"
            />
          </form>

          <div className="flex items-center gap-3 text-[11.5px] uppercase tracking-[0.1em] text-muted">
            <span>Sort</span>
            <div className="flex gap-1">
              {SORTS.map((option) => (
                <Link
                  key={option.id}
                  href={buildHref({ sort: option.id })}
                  className={cn(
                    'rounded px-2.5 py-1 transition',
                    sort === option.id ? 'bg-ink/10 text-ink' : 'hover:text-ink',
                  )}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-[12px] uppercase tracking-[0.12em] text-muted">
        {products.length} {products.length === 1 ? 'product' : 'products'}
        {q ? ` matching “${q}”` : ''}
      </p>

      {products.length === 0 ? (
        <div className="mt-12 rounded-sm border border-dashed border-hairline px-6 py-20 text-center">
          <p className="font-display text-2xl">Nothing matched that.</p>
          <p className="mx-auto mt-3 max-w-sm text-[14px] text-graphite">
            Try a different word, or clear the filters to see the whole catalogue.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex rounded-full border border-ink/20 px-6 py-2.5 text-[12px] uppercase tracking-[0.14em] text-ink transition hover:border-ink"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-12 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} currency={settings.currency} />
          ))}
        </div>
      )}
    </div>
  );
}
