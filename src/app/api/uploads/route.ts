import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { requireApiUser, fail, json } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

const MAX_BYTES = 6 * 1024 * 1024;

export async function POST(request: Request) {
  const { response } = await requireApiUser();
  if (response) return response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail('Expected a multipart form upload.', 415);
  }

  const file = form.get('file');
  if (!(file instanceof File)) return fail('No file was provided.', 422);

  const extension = ALLOWED[file.type];
  if (!extension) return fail('Only PNG, JPEG, WEBP, AVIF and GIF images are allowed.', 415);
  if (file.size > MAX_BYTES) return fail('Images must be smaller than 6 MB.', 413);

  const dir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  await fs.writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

  return json({ data: { url: `/uploads/${filename}` } }, 201);
}
