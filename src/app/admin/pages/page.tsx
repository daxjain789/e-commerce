import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Badge, Card, EmptyState, PageHeader, statusTone } from '@/components/admin/ui';
import { DeleteButton } from '@/components/admin/delete-button';
import { requireUser } from '@/lib/auth';
import { listPages } from '@/lib/repo/pages';
import { adminButtonPrimary } from '@/lib/ui';

export const dynamic = 'force-dynamic';

export default async function AdminPagesPage() {
  await requireUser();
  const pages = listPages();

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Content"
        title="Pages"
        description="Every storefront page is built from blocks — hero, product grid, FAQ, rich text and more."
        actions={
          <Link href="/admin/pages/new" className={adminButtonPrimary}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            New page
          </Link>
        }
      />

      {pages.length === 0 ? (
        <EmptyState
          title="No pages yet"
          description="The home page is a CMS page with the slug “home”. Create it to control the storefront."
          action={
            <Link href="/admin/pages/new" className={adminButtonPrimary}>
              Create a page
            </Link>
          }
        />
      ) : (
        <Card bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-hairline text-[10.5px] uppercase tracking-[0.1em] text-muted">
                  <th className="px-5 py-3 font-semibold">Page</th>
                  <th className="px-3 py-3 font-semibold">URL</th>
                  <th className="px-3 py-3 font-semibold">Blocks</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Updated</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {pages.map((page) => (
                  <tr key={page.id} className="transition hover:bg-ink/[0.02]">
                    <td className="px-5 py-3">
                      <Link href={`/admin/pages/${page.id}`} className="line-clamp-2 font-medium hover:text-accent wrap-anywhere">
                        {page.title}
                      </Link>
                      <p className="text-[11px] text-muted">{page.seoTitle || 'No SEO title set'}</p>
                    </td>
                    <td className="px-3 py-3 text-graphite">/{page.slug === 'home' ? '' : page.slug}</td>
                    <td className="px-3 py-3 text-graphite">{page.blocks.length}</td>
                    <td className="px-3 py-3">
                      <Badge tone={statusTone(page.status)}>{page.status}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-graphite">
                      {new Date(page.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <Link href={`/admin/pages/${page.id}`} className="text-[12px] text-graphite hover:text-ink">
                          Edit
                        </Link>
                        <Link
                          href={page.slug === 'home' ? '/' : `/${page.slug}`}
                          target="_blank"
                          className="text-[12px] text-graphite hover:text-ink"
                        >
                          View
                        </Link>
                        <DeleteButton endpoint={`/api/pages/${page.id}`} label="Delete" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
