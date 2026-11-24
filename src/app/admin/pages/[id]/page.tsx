import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/admin/ui';
import { PageEditor } from '@/components/admin/page-editor';
import { requireUser } from '@/lib/auth';
import { getPageById } from '@/lib/repo/pages';

export const dynamic = 'force-dynamic';

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const page = getPageById(id);
  if (!page) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Content"
        title={page.title}
        description={`Last updated ${new Date(page.updatedAt).toLocaleString('en-US')}`}
        actions={
          <>
            <Link
              href={page.slug === 'home' ? '/' : `/${page.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-white px-3 py-2 text-[12.5px] text-ink hover:border-ink/30"
            >
              View page
              <ExternalLink className="h-3 w-3" strokeWidth={1.8} />
            </Link>
            <Link href="/admin/pages" className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.1em] text-graphite hover:text-ink">
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
              Back
            </Link>
          </>
        }
      />
      <PageEditor
        page={{
          id: page.id,
          title: page.title,
          slug: page.slug,
          status: page.status,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          blocks: page.blocks,
        }}
      />
    </div>
  );
}
