import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-[11px] uppercase tracking-[0.24em] text-muted">404</p>
      <h1 className="mt-5 font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-none tracking-[-0.035em]">
        This page has gone missing.
      </h1>
      <p className="mt-5 max-w-md text-[14.5px] leading-relaxed text-graphite">
        The link may be old, or the page may have been unpublished in the admin panel. The shop is still open.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/products"
          className="rounded-full bg-ink px-7 py-3.5 text-[12px] uppercase tracking-[0.16em] text-paper transition hover:bg-accent"
        >
          Browse the shop
        </Link>
        <Link href="/" className="text-[12.5px] uppercase tracking-[0.12em] text-graphite hover:text-ink">
          Back home
        </Link>
      </div>
    </div>
  );
}
