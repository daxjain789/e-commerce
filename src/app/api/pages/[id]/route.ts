import { requireApiUser, fail, json, readJson } from '@/lib/http';
import { deletePage, getPageById, updatePage } from '@/lib/repo/pages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiUser();
  if (response) return response;
  const { id } = await params;
  if (!getPageById(id)) return fail('Page not found.', 404);

  const body = await readJson<Record<string, unknown>>(request);
  const page = updatePage(id, {
    title: body.title === undefined ? undefined : String(body.title),
    slug: body.slug === undefined ? undefined : String(body.slug),
    blocks: body.blocks === undefined ? undefined : (Array.isArray(body.blocks) ? body.blocks : []),
    status: body.status === 'draft' ? 'draft' : body.status === 'published' ? 'published' : undefined,
    seoTitle: body.seoTitle === undefined ? undefined : String(body.seoTitle),
    seoDescription: body.seoDescription === undefined ? undefined : String(body.seoDescription),
  });
  return json({ data: page });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiUser();
  if (response) return response;
  const { id } = await params;
  deletePage(id);
  return json({ ok: true });
}
