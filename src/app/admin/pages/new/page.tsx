import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/admin/ui';
import { PageEditor } from '@/components/admin/page-editor';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function NewPagePage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Content"
        title="New page"
        description="Give it a title and slug, then add blocks. Nothing is public until the status is Published."
        actions={
          <Link href="/admin/pages" className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.1em] text-graphite hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
            All pages
          </Link>
        }
      />
      <PageEditor
        page={{
          title: '',
          slug: '',
          status: 'draft',
          seoTitle: '',
          seoDescription: '',
          blocks: [],
        }}
      />
    </div>
  );
}
