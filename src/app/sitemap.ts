import type { MetadataRoute } from 'next';
import { listProducts } from '@/lib/repo/products';
import { listPages } from '@/lib/repo/pages';

export const dynamic = 'force-dynamic';

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = baseUrl();
  const now = new Date();

  const pages = listPages()
    .filter((page) => page.status === 'published' && page.slug !== 'home')
    .map((page) => ({
      url: `${base}/${page.slug}`,
      lastModified: new Date(page.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

  const products = listProducts({ status: 'active', limit: 500 }).map((product) => ({
    url: `${base}/products/${product.slug}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/products`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    ...products,
    ...pages,
  ];
}
