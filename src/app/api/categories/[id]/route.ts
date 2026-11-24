import { requireApiUser, fail, json, readJson } from '@/lib/http';
import { deleteCategory, listCategories, updateCategory } from '@/lib/repo/categories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiUser();
  if (response) return response;
  const { id } = await params;
  const body = await readJson<Record<string, unknown>>(request);
  const category = updateCategory(id, {
    name: body.name === undefined ? undefined : String(body.name),
    slug: body.slug === undefined ? undefined : String(body.slug),
    description: body.description === undefined ? undefined : String(body.description),
    image: body.image === undefined ? undefined : String(body.image),
    position: body.position === undefined ? undefined : Number(body.position),
  });
  if (!category) return fail('Category not found.', 404);
  return json({ data: category });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiUser();
  if (response) return response;
  const { id } = await params;
  deleteCategory(id);
  return json({ ok: true, data: listCategories() });
}
