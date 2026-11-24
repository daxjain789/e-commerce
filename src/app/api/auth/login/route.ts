import { authenticate, createSession, pruneSessions } from '@/lib/auth';
import { fail, json, readJson } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await readJson<{ email?: string; password?: string }>(request);
  const email = String(body.email ?? '').trim();
  const password = String(body.password ?? '');

  if (!email || !password) return fail('Email and password are required.', 422);

  const user = authenticate(email, password);
  if (!user) return fail('Those credentials do not match an account.', 401);

  pruneSessions();
  await createSession(user.id);
  return json({ ok: true, user: { name: user.name, email: user.email } });
}
