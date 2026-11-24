import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { RichText } from '@/lib/richtext';
import { getFeaturedProducts, listProducts } from '@/lib/repo/products';
import type { Block } from '@/lib/types';
import { ProductCard } from './product-card';

export function Blocks({ blocks, currency = 'USD' }: { blocks: Block[]; currency?: string }) {
  return (
    <>
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} currency={currency} />
      ))}
    </>
  );
}

function BlockView({ block, currency }: { block: Block; currency: string }) {
  switch (block.type) {
    case 'hero':
      return <Hero props={block.props} />;
    case 'productGrid':
      return <ProductGrid props={block.props} currency={currency} />;
    case 'imageText':
      return <ImageText props={block.props} />;
    case 'featureList':
      return <FeatureList props={block.props} />;
    case 'faq':
      return <Faq props={block.props} />;
    case 'cta':
      return <Cta props={block.props} />;
    case 'gallery':
      return <Gallery props={block.props} />;
    case 'quote':
      return <Quote props={block.props} />;
    case 'richText':
      return (
        <section className="shell py-14 lg:py-20">
          <div className="mx-auto max-w-2xl">
            <RichText text={String(block.props.body ?? '')} />
          </div>
        </section>
      );
    default:
      return null;
  }
}

function CtaButtons({
  ctaLabel,
  ctaHref,
  secondaryLabel,
  secondaryHref,
}: {
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  if (!ctaLabel && !secondaryLabel) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {ctaLabel && ctaHref ? (
        <Link
          href={ctaHref}
          className="group inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-[12px] font-medium uppercase tracking-[0.16em] text-paper transition hover:bg-accent"
        >
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} />
        </Link>
      ) : null}
      {secondaryLabel && secondaryHref ? (
        <Link
          href={secondaryHref}
          className="link-underline pb-1 text-[13px] text-graphite transition hover:text-ink"
        >
          {secondaryLabel}
        </Link>
      ) : null}
    </div>
  );
}

function Hero({ props }: { props: Record<string, any> }) {
  const alignCenter = props.align === 'center';
  const hasImage = Boolean(props.image);

  if (alignCenter || !hasImage) {
    return (
      <section className="border-b border-hairline">
        <div className={`shell flex flex-col py-16 lg:py-24 ${alignCenter ? 'items-center text-center' : ''}`}>
          {props.eyebrow ? <p className="eyebrow">{props.eyebrow}</p> : null}
          <h1 className={`display-title mt-5 max-w-[22ch] text-balance ${alignCenter ? 'mx-auto' : ''}`}>
            {props.title}
          </h1>
          {props.body ? (
            <p className={`mt-6 max-w-xl text-[16px] leading-relaxed text-graphite text-pretty ${alignCenter ? 'mx-auto' : ''}`}>
              {props.body}
            </p>
          ) : null}
          <div className={`mt-9 ${alignCenter ? 'flex justify-center' : ''}`}>
            <CtaButtons
              ctaLabel={props.ctaLabel}
              ctaHref={props.ctaHref}
              secondaryLabel={props.secondaryLabel}
              secondaryHref={props.secondaryHref}
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-hairline">
      <div className="shell grid items-center gap-12 py-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:py-16">
        <div className="max-w-xl">
          {props.eyebrow ? (
            <p className="eyebrow flex items-start gap-3">
              <span className="mt-[9px] hidden h-px w-8 shrink-0 bg-ink/25 sm:block" aria-hidden="true" />
              <span>{props.eyebrow}</span>
            </p>
          ) : null}
          <h1 className="display-title mt-6 text-balance">{props.title}</h1>
          {props.body ? (
            <p className="mt-6 max-w-lg text-[15.5px] leading-[1.7] text-graphite text-pretty">{props.body}</p>
          ) : null}
          <div className="mt-9">
            <CtaButtons
              ctaLabel={props.ctaLabel}
              ctaHref={props.ctaHref}
              secondaryLabel={props.secondaryLabel}
              secondaryHref={props.secondaryHref}
            />
          </div>
        </div>

        <div className="relative">
          <div className="aspect-[5/6] w-full overflow-hidden rounded-sm bg-parchment lg:aspect-[4/5]">
            <img src={props.image} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="absolute -bottom-5 left-5 hidden max-w-[210px] rounded-sm border border-hairline bg-paper/95 px-4 py-3 backdrop-blur sm:block">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted">The studio note</p>
            <p className="mt-1 text-[12.5px] leading-snug text-graphite">
              Made in short runs. Repaired for life. Shipped in paper.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductGrid({ props, currency }: { props: Record<string, any>; currency: string }) {
  const limit = Math.min(Math.max(Number(props.limit) || 4, 1), 12);
  const products =
    props.source === 'category' && props.categorySlug
      ? listProducts({ categorySlug: props.categorySlug, status: 'active', limit })
      : props.source === 'all'
        ? listProducts({ status: 'active', limit, sort: 'newest' })
        : getFeaturedProducts(limit);

  if (products.length === 0) return null;

  return (
    <section className="shell py-16 lg:py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          {props.eyebrow ? <p className="eyebrow">{props.eyebrow}</p> : null}
          <h2 className="mt-4 text-[clamp(1.9rem,3.2vw,2.9rem)] leading-[1.02] tracking-[-0.03em] text-balance">
            {props.title}
          </h2>
          {props.body ? <p className="mt-4 text-[14.5px] leading-relaxed text-graphite">{props.body}</p> : null}
        </div>
        {props.ctaLabel && props.ctaHref ? (
          <Link
            href={props.ctaHref}
            className="group inline-flex items-center gap-2 border-b border-ink/25 pb-1 text-[12px] uppercase tracking-[0.14em] text-graphite transition hover:border-ink hover:text-ink"
          >
            {props.ctaLabel}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.8} />
          </Link>
        ) : null}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} currency={currency} />
        ))}
      </div>
    </section>
  );
}

function ImageText({ props }: { props: Record<string, any> }) {
  const imageRight = props.imageSide !== 'left';
  return (
    <section className="border-t border-hairline">
      <div className="shell grid items-center gap-10 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div className={`relative ${imageRight ? '' : 'lg:order-2'}`}>
          <div className="aspect-[4/3] w-full overflow-hidden rounded-sm bg-parchment">
            {props.image ? <img src={props.image} alt="" className="h-full w-full object-cover" /> : null}
          </div>
        </div>
        <div className={`max-w-lg ${imageRight ? '' : 'lg:order-1'}`}>
          {props.eyebrow ? <p className="eyebrow">{props.eyebrow}</p> : null}
          <h2 className="mt-4 text-[clamp(1.8rem,3vw,2.7rem)] leading-[1.05] tracking-[-0.03em] text-balance">
            {props.title}
          </h2>
          {props.body ? (
            <p className="mt-5 whitespace-pre-line text-[15px] leading-[1.75] text-graphite text-pretty">
              {props.body}
            </p>
          ) : null}
          {props.ctaLabel && props.ctaHref ? (
            <Link
              href={props.ctaHref}
              className="mt-7 inline-flex items-center gap-2 border-b border-ink/25 pb-1 text-[12px] uppercase tracking-[0.14em] text-ink transition hover:border-accent hover:text-accent"
            >
              {props.ctaLabel}
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function FeatureList({ props }: { props: Record<string, any> }) {
  const items: { title: string; body: string }[] = Array.isArray(props.items) ? props.items : [];
  if (items.length === 0) return null;
  return (
    <section className="shell py-16 lg:py-20">
      <div className="rounded-sm bg-parchment/70 px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            {props.eyebrow ? <p className="eyebrow">{props.eyebrow}</p> : null}
            <h2 className="mt-4 text-[clamp(1.7rem,2.6vw,2.3rem)] leading-[1.08] tracking-[-0.03em]">
              {props.title}
            </h2>
          </div>
          <dl className="grid gap-8 sm:grid-cols-3 sm:gap-6">
            {items.map((item, index) => (
              <div key={`${item.title}-${index}`} className="border-t border-ink/15 pt-4">
                <dt className="text-[10.5px] uppercase tracking-[0.18em] text-muted">
                  {String(index + 1).padStart(2, '0')}
                </dt>
                <dd className="mt-2">
                  <p className="font-display text-[17px] leading-snug text-ink">{item.title}</p>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-graphite">{item.body}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function Faq({ props }: { props: Record<string, any> }) {
  const items: { question: string; answer: string }[] = Array.isArray(props.items) ? props.items : [];
  if (items.length === 0) return null;
  return (
    <section className="shell py-14 lg:py-20">
      <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
        <h2 className="text-[clamp(1.6rem,2.4vw,2.1rem)] leading-tight tracking-[-0.03em]">{props.title}</h2>
        <div className="border-t border-hairline">
          {items.map((item, index) => (
            <details key={`${item.question}-${index}`} className="group border-b border-hairline">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[15px] text-ink [&::-webkit-details-marker]:hidden">
                <span className="text-pretty">{item.question}</span>
                <span
                  aria-hidden="true"
                  className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink/20 text-[13px] leading-none text-graphite transition group-open:rotate-45 group-open:border-ink group-open:text-ink"
                >
                  +
                </span>
              </summary>
              <p className="max-w-2xl pb-6 pr-10 text-[14px] leading-[1.7] text-graphite text-pretty">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta({ props }: { props: Record<string, any> }) {
  return (
    <section className="shell py-16 lg:py-24">
      <div className="relative overflow-hidden rounded-sm bg-ink text-paper">
        <div className={`grid items-center gap-8 ${props.image ? 'lg:grid-cols-[1.15fr_0.85fr]' : ''}`}>
          <div className="px-7 py-12 sm:px-12 lg:py-16">
            <h2 className="max-w-lg text-[clamp(1.9rem,3vw,2.8rem)] leading-[1.03] tracking-[-0.03em] text-balance">
              {props.title}
            </h2>
            {props.body ? (
              <p className="mt-5 max-w-md text-[14.5px] leading-relaxed text-paper/70">{props.body}</p>
            ) : null}
            {props.ctaLabel && props.ctaHref ? (
              <Link
                href={props.ctaHref}
                className="group mt-8 inline-flex items-center gap-2 rounded-full bg-paper px-7 py-3.5 text-[12px] font-medium uppercase tracking-[0.16em] text-ink transition hover:bg-accent hover:text-white"
              >
                {props.ctaLabel}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} />
              </Link>
            ) : null}
          </div>
          {props.image ? (
            <div className="relative h-64 w-full lg:h-full lg:min-h-[320px]">
              <img src={props.image} alt="" className="h-full w-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/20 to-transparent lg:bg-gradient-to-l" />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Gallery({ props }: { props: Record<string, any> }) {
  const images: { src: string; alt?: string }[] = Array.isArray(props.images) ? props.images : [];
  if (images.length === 0) return null;
  return (
    <section className="shell py-14 lg:py-20">
      {props.title ? (
        <h2 className="text-[clamp(1.6rem,2.4vw,2.1rem)] tracking-[-0.03em]">{props.title}</h2>
      ) : null}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {images.map((image, index) => (
          <figure key={`${image.src}-${index}`} className={index === 0 ? 'col-span-2 sm:col-span-1' : ''}>
            <div className="aspect-square overflow-hidden rounded-sm bg-parchment">
              <img src={image.src} alt={image.alt ?? ''} className="h-full w-full object-cover" loading="lazy" />
            </div>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Quote({ props }: { props: Record<string, any> }) {
  return (
    <section className="border-y border-hairline bg-parchment/40">
      <div className="shell py-16 lg:py-24">
        <figure className="mx-auto max-w-3xl text-center">
          <blockquote className="font-display text-[clamp(1.5rem,3vw,2.4rem)] leading-[1.25] tracking-[-0.02em] text-ink text-balance">
            <span className="text-accent">“</span>
            {props.quote}
            <span className="text-accent">”</span>
          </blockquote>
          {props.author ? (
            <figcaption className="mt-7 text-[11px] uppercase tracking-[0.18em] text-graphite">
              {props.author}
              {props.role ? <span className="text-muted"> · {props.role}</span> : null}
            </figcaption>
          ) : null}
        </figure>
      </div>
    </section>
  );
}
