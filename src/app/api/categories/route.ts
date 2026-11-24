import { requireApiUser, fail, json, readJson } from '@/lib/http';
import { createCategory, listCategories } from '@/lib/repo/categories';
import { ValidationError, optionalInt, optionalString, requireString } from '@/lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return json({ data: listCategories() });
}

export async function POST(request: Request) {
  const { response } = await requireApiUser();
  if (response) return response;
  const body = await readJson<Record<string, unknown>>(request);
  try {
    const category = createCategory({
      name: requireString(body.name, 'Name', { max: 80 }),
      slug: optionalString(body.slug, { max: 80 }) || undefined,
      description: optionalString(body.description, { max: 400 }),
      image: optionalString(body.image, { max: 500 }),
      position: optionalInt(body.position) ?? undefined,
    });
    return json({ data: category }, 201);
  } catch (error) {
    if (error instanceof ValidationError) return fail(error.message, 422);
    return fail('Could not create the category.', 500);
  }
}
