import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth';
import { fail, json, readJson } from '@/lib/http';
import { get, run } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return fail('Unauthorized', 401);

  const body = await readJson<{ currentPassword?: string; newPassword?: string }>(request);
  const current = String(body.currentPassword ?? '');
  const next = String(body.newPassword ?? '');

  if (!current || !next) return fail('Both the current and new password are required.', 422);
  if (next.length < 8) return fail('The new password must be at least 8 characters.', 422);

  const row = get<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = ?', user.id);
  if (!row || !verifyPassword(current, row.password_hash)) return fail('The current password is not correct.', 403);

  run('UPDATE users SET password_hash = ? WHERE id = ?', hashPassword(next), user.id);
  return json({ ok: true });
}
