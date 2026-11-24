import Link from 'next/link';
import { formatMoney } from '@/lib/money';
import type { Product } from '@/lib/types';
import { QuickAdd } from './quick-add';

export function ProductCard({ product, currency = 'USD' }: { product: Product; currency?: string }) {
  const soldOut = product.stock <= 0;
  const onSale = product.compareAtCents !== null && product.compareAtCents > product.priceCents;

  return (
    <article className="group flex flex-col">
      <div className="relative overflow-hidden rounded-sm bg-parchment">
        <Link href={`/products/${product.slug}`} className="block" aria-label={product.name}>
          <div className="aspect-[4/5] w-full overflow-hidden">
            {product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                loading="lazy"
                className={`h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.035] ${
                  soldOut ? 'opacity-60' : ''
                }`}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-parchment text-[11px] uppercase tracking-[0.2em] text-muted">
                No image
              </div>
            )}
          </div>
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {onSale ? (
            <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white">
              Sale
            </span>
          ) : null}
          {soldOut ? (
            <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-paper">
              Sold out
            </span>
          ) : product.stock <= 5 ? (
            <span className="rounded-full bg-paper/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-graphite backdrop-blur">
              Only {product.stock} left
            </span>
          ) : null}
        </div>

        {!soldOut ? (
          <div className="absolute inset-x-3 bottom-3 translate-y-0 opacity-100 transition duration-300 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100">
            <QuickAdd
              product={{
                productId: product.id,
                slug: product.slug,
                name: product.name,
                priceCents: product.priceCents,
                image: product.images[0] ?? '',
                max: product.stock,
              }}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {product.categoryName ? (
            <p className="text-[10.5px] uppercase tracking-[0.16em] text-muted">{product.categoryName}</p>
          ) : null}
          <h3 className="mt-1 line-clamp-2 text-[15px] leading-snug text-ink wrap-anywhere">
            <Link href={`/products/${product.slug}`} className="hover:text-accent">
              {product.name}
            </Link>
          </h3>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[14px] tabular-nums text-ink">{formatMoney(product.priceCents, currency)}</p>
          {onSale ? (
            <p className="text-[12px] tabular-nums text-muted line-through">
              {formatMoney(product.compareAtCents!, currency)}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
