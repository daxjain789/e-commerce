import Link from 'next/link';
import { Blocks } from '@/components/store/blocks';
import { getPageBySlug } from '@/lib/repo/pages';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const settings = getSettings();
  const page = getPageBySlug('home');

  if (!page || page.status !== 'published') {
    return (
      <section className="shell py-24">
        <p className="eyebrow">Welcome</p>
        <h1 className="display-title mt-5 max-w-[18ch]">{settings.siteName}</h1>
        <p className="mt-6 max-w-lg text-[15.5px] leading-relaxed text-graphite">{settings.description}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/products"
            className="rounded-full bg-ink px-7 py-3.5 text-[12px] uppercase tracking-[0.16em] text-paper transition hover:bg-accent"
          >
            Browse products
          </Link>
          <Link
            href="/admin"
            className="rounded-full border border-ink/20 px-7 py-3.5 text-[12px] uppercase tracking-[0.16em] text-ink transition hover:border-ink"
          >
            Admin panel
          </Link>
        </div>
      </section>
    );
  }

  return <Blocks blocks={page.blocks} currency={settings.currency} />;
}
