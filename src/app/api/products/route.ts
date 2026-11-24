import { requireApiUser, fail, json, readJson } from '@/lib/http';
import { createProduct, listProducts } from '@/lib/repo/products';
import { ValidationError, optionalInt, optionalString, requireString } from '@/lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const products = listProducts({
    search: url.searchParams.get('q') ?? undefined,
    categorySlug: url.searchParams.get('category') ?? undefined,
    status: 'active',
    sort: (url.searchParams.get('sort') as 'newest' | undefined) ?? 'newest',
    limit: Number(url.searchParams.get('limit') ?? 100) || 100,
  });
  return json({
    data: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.priceCents,
      currency: 'USD',
      stock: p.stock,
      images: p.images,
      category: p.categoryName,
      url: `/products/${p.slug}`,
    })),
  });
}

export async function POST(request: Request) {
  const { response } = await requireApiUser();
  if (response) return response;

  const body = await readJson<Record<string, unknown>>(request);
  try {
    const images = Array.isArray(body.images) ? (body.images as string[]).slice(0, 8) : [];
    const product = createProduct({
      name: requireString(body.name, 'Name', { max: 140 }),
      slug: optionalString(body.slug, { max: 80 }) || undefined,
      description: optionalString(body.description, { max: 20000 }),
      priceCents: optionalInt(body.priceCents) ?? 0,
      compareAtCents: optionalInt(body.compareAtCents),
      sku: optionalString(body.sku, { max: 60 }),
      stock: optionalInt(body.stock) ?? 0,
      categoryId: optionalString(body.categoryId) || null,
      images,
      status: body.status === 'draft' ? 'draft' : 'active',
      featured: Boolean(body.featured),
    });
    return json({ data: product }, 201);
  } catch (error) {
    if (error instanceof ValidationError) return fail(error.message, 422);
    return fail('Could not create the product.', 500);
  }
}
