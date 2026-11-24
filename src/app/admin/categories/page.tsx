import { PageHeader } from '@/components/admin/ui';
import { CategoryManager } from '@/components/admin/category-manager';
import { requireUser } from '@/lib/auth';
import { listCategories } from '@/lib/repo/categories';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  await requireUser();
  const categories = listCategories();

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Catalogue"
        title="Categories"
        description="Categories drive the storefront filter bar and can be used by product grid blocks."
      />
      <CategoryManager
        initial={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          position: c.position,
          productCount: c.productCount ?? 0,
        }))}
      />
    </div>
  );
}
