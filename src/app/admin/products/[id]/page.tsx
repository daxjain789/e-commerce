import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/admin/ui';
import { ProductForm } from '@/components/admin/product-form';
import { requireUser } from '@/lib/auth';
import { listCategories } from '@/lib/repo/categories';
import { getProductById } from '@/lib/repo/products';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const product = getProductById(id);
  if (!product) notFound();
  const categories = listCategories();

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Catalogue"
        title={product.name}
        description={`Last updated ${new Date(product.updatedAt).toLocaleString('en-US')}`}
        actions={
          <>
            <Link href={`/products/${product.slug}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-white px-3 py-2 text-[12.5px] text-ink hover:border-ink/30">
              View on store
              <ExternalLink className="h-3 w-3" strokeWidth={1.8} />
            </Link>
            <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.1em] text-graphite hover:text-ink">
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
              Back
            </Link>
          </>
        }
      />
      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          priceCents: product.priceCents,
          compareAtCents: product.compareAtCents,
          sku: product.sku,
          stock: product.stock,
          categoryId: product.categoryId,
          images: product.images,
          status: product.status,
          featured: product.featured,
        }}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
