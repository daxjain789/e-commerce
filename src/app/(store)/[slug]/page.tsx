import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Blocks } from '@/components/store/blocks';
import { getPageBySlug } from '@/lib/repo/pages';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getPageBySlug(slug);
  if (!page) return { title: 'Page not found' };
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
  };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getPageBySlug(slug);
  if (!page || page.status !== 'published') notFound();
  const settings = getSettings();

  return <Blocks blocks={page.blocks} currency={settings.currency} />;
}
