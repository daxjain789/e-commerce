import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/admin/ui';
import { ProductForm } from '@/components/admin/product-form';
import { requireUser } from '@/lib/auth';
import { listCategories } from '@/lib/repo/categories';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  await requireUser();
  const categories = listCategories();

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Catalogue"
        title="New product"
        description="It goes live on the storefront as soon as you save it as active."
        actions={
          <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.1em] text-graphite hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
            Back to products
          </Link>
        }
      />
      <ProductForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
