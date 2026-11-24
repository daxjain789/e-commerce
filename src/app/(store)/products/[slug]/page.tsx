import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Truck } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AddToCart } from '@/components/store/add-to-cart';
import { ProductCard } from '@/components/store/product-card';
import { RichText } from '@/lib/richtext';
import { formatMoney } from '@/lib/money';
import { getProductBySlug, relatedProducts } from '@/lib/repo/products';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: 'Product not found' };
  return {
    title: product.name,
    description: product.description.split('\n')[0].slice(0, 180),
    openGraph: { images: product.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product || product.status !== 'active') notFound();

  const settings = getSettings();
  const related = relatedProducts(product, 4);
  const onSale = product.compareAtCents !== null && product.compareAtCents > product.priceCents;
  const soldOut = product.stock <= 0;
  const freeShipping = settings.freeShippingThresholdCents > 0 && product.priceCents >= settings.freeShippingThresholdCents;

  return (
    <div className="shell py-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[11.5px] uppercase tracking-[0.12em] text-muted">
        <Link href="/products" className="hover:text-ink">
          Shop
        </Link>
        <ChevronRight className="h-3 w-3" strokeWidth={1.6} />
        {product.categorySlug ? (
          <>
            <Link href={`/products?category=${product.categorySlug}`} className="hover:text-ink">
              {product.categoryName}
            </Link>
            <ChevronRight className="h-3 w-3" strokeWidth={1.6} />
          </>
        ) : null}
        <span className="text-graphite">{product.name}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
        <div>
          <div className="overflow-hidden rounded-sm bg-parchment">
            <div className="aspect-[4/5] w-full">
              {product.images[0] ? (
                <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[11px] uppercase tracking-[0.2em] text-muted">
                  No image
                </div>
              )}
            </div>
          </div>
          {product.images.length > 1 ? (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {product.images.slice(1, 5).map((image, index) => (
                <div key={`${image}-${index}`} className="aspect-square overflow-hidden rounded-sm bg-parchment">
                  <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          {product.categoryName ? (
            <Link
              href={`/products?category=${product.categorySlug}`}
              className="text-[10.5px] uppercase tracking-[0.18em] text-muted transition hover:text-ink"
            >
              {product.categoryName}
            </Link>
          ) : null}
          <h1 className="mt-3 text-[clamp(1.9rem,3.4vw,2.8rem)] leading-[1.03] tracking-[-0.035em] text-balance wrap-anywhere">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-[19px] tabular-nums text-ink">{formatMoney(product.priceCents, settings.currency)}</span>
            {onSale ? (
              <>
                <span className="text-[14px] tabular-nums text-muted line-through">
                  {formatMoney(product.compareAtCents!, settings.currency)}
                </span>
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-accent">
                  Save {Math.round((1 - product.priceCents / product.compareAtCents!) * 100)}%
                </span>
              </>
            ) : null}
          </div>

          <div className="mt-6 text-[14.5px] leading-relaxed text-graphite">
            <RichText text={product.description} className="prose-meridian text-[14.5px]" />
          </div>

          <div className="mt-8 border-t border-hairline pt-7">
            <AddToCart
              product={{
                productId: product.id,
                slug: product.slug,
                name: product.name,
                priceCents: product.priceCents,
                image: product.images[0] ?? '',
                max: product.stock,
              }}
              stock={product.stock}
            />
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-sm bg-parchment/60 px-4 py-3.5">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-graphite" strokeWidth={1.5} />
            <p className="text-[12.5px] leading-relaxed text-graphite">
              {freeShipping
                ? 'Ships free — this piece clears our free-shipping threshold. Dispatched within two business days.'
                : `Flat ${formatMoney(settings.flatShippingCents, settings.currency)} shipping, free over ${formatMoney(settings.freeShippingThresholdCents, settings.currency)}. Dispatched in two business days.`}
            </p>
          </div>

          <div className="mt-4 divide-y divide-hairline border-y border-hairline">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[13px] text-ink [&::-webkit-details-marker]:hidden">
                Materials & dimensions
                <span className="text-muted transition group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <div className="pb-5 text-[13.5px] leading-relaxed text-graphite">
                Details are maintained by the studio in the admin panel. Add them to the product description
                or extend this section in <code className="rounded bg-ink/5 px-1 py-0.5 text-[12px]">products/[slug]/page.tsx</code>.
              </div>
            </details>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[13px] text-ink [&::-webkit-details-marker]:hidden">
                Repairs & returns
                <span className="text-muted transition group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <div className="pb-5 text-[13.5px] leading-relaxed text-graphite">
                30 days to return unused items. Repairs are free for as long as you own the piece — send a
                photo to {settings.supportEmail || 'the studio'} and we will arrange collection.
              </div>
            </details>
          </div>

          {product.sku ? (
            <p className="mt-6 text-[11px] uppercase tracking-[0.14em] text-muted">SKU {product.sku}</p>
          ) : null}
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-20 border-t border-hairline pt-12">
          <div className="flex items-end justify-between gap-6">
            <h2 className="text-[clamp(1.4rem,2.2vw,1.9rem)] tracking-[-0.03em]">Goes well with</h2>
            <Link href="/products" className="text-[11.5px] uppercase tracking-[0.14em] text-graphite hover:text-ink">
              View all
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} currency={settings.currency} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
