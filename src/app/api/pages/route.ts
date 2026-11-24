import { requireApiUser, fail, json, readJson } from '@/lib/http';
import { createPage, listPages } from '@/lib/repo/pages';
import { ValidationError, optionalString, requireString } from '@/lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { response } = await requireApiUser();
  if (response) return response;
  return json({ data: listPages() });
}

export async function POST(request: Request) {
  const { response } = await requireApiUser();
  if (response) return response;
  const body = await readJson<Record<string, unknown>>(request);
  try {
    const page = createPage({
      title: requireString(body.title, 'Title', { max: 120 }),
      slug: optionalString(body.slug, { max: 80 }) || undefined,
      blocks: Array.isArray(body.blocks) ? (body.blocks as any[]) : [],
      status: body.status === 'draft' ? 'draft' : 'published',
      seoTitle: optionalString(body.seoTitle, { max: 160 }),
      seoDescription: optionalString(body.seoDescription, { max: 300 }),
    });
    return json({ data: page }, 201);
  } catch (error) {
    if (error instanceof ValidationError) return fail(error.message, 422);
    return fail('Could not create the page.', 500);
  }
}
