import { requireApiUser, fail, json, readJson } from '@/lib/http';
import { deleteProduct, getProductById, updateProduct } from '@/lib/repo/products';
import { ValidationError, optionalInt, optionalString, requireString } from '@/lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiUser();
  if (response) return response;
  const { id } = await params;

  const current = getProductById(id);
  if (!current) return fail('Product not found.', 404);

  const body = await readJson<Record<string, unknown>>(request);
  try {
    const product = updateProduct(id, {
      name: body.name === undefined ? current.name : requireString(body.name, 'Name', { max: 140 }),
      slug: body.slug === undefined ? current.slug : optionalString(body.slug, { max: 80 }),
      description: body.description === undefined ? current.description : optionalString(body.description, { max: 20000 }),
      priceCents: body.priceCents === undefined ? current.priceCents : optionalInt(body.priceCents) ?? 0,
      compareAtCents: body.compareAtCents === undefined ? current.compareAtCents : optionalInt(body.compareAtCents),
      sku: body.sku === undefined ? current.sku : optionalString(body.sku, { max: 60 }),
      stock: body.stock === undefined ? current.stock : optionalInt(body.stock) ?? 0,
      categoryId: body.categoryId === undefined ? current.categoryId : optionalString(body.categoryId) || null,
      images: body.images === undefined ? current.images : (Array.isArray(body.images) ? (body.images as string[]).slice(0, 8) : []),
      status: body.status === undefined ? current.status : body.status === 'draft' ? 'draft' : 'active',
      featured: body.featured === undefined ? current.featured : Boolean(body.featured),
    });
    return json({ data: product });
  } catch (error) {
    if (error instanceof ValidationError) return fail(error.message, 422);
    return fail('Could not update the product.', 500);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiUser();
  if (response) return response;
  const { id } = await params;
  if (!getProductById(id)) return fail('Product not found.', 404);
  deleteProduct(id);
  return json({ ok: true });
}
