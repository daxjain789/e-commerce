import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { randomBytes, randomUUID } from 'node:crypto';
import { get, run } from './db';
import { hashPassword, verifyPassword } from './password';

export { hashPassword, verifyPassword };
import type { User } from './types';

const COOKIE = 'mc_session';
const SESSION_DAYS = 14;

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
  };
}

export function authenticate(email: string, password: string): User | null {
  const row = get<UserRow & { password_hash: string }>(
    'SELECT * FROM users WHERE lower(email) = lower(?)',
    email.trim(),
  );
  if (!row) return null;
  if (!verifyPassword(password, row.password_hash)) return null;
  return toUser(row);
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  run(
    'INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
    token,
    userId,
    expires,
    new Date().toISOString(),
  );
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(expires),
  });
  return token;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) run('DELETE FROM sessions WHERE token = ?', token);
  store.delete(COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const row = get<UserRow>(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token = ? AND s.expires_at > ?`,
    token,
    new Date().toISOString(),
  );
  return row ? toUser(row) : null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  return user;
}

/** Trim expired sessions. Called opportunistically from the login route. */
export function pruneSessions(): void {
  run('DELETE FROM sessions WHERE expires_at <= ?', new Date().toISOString());
}

export function userCount(): number {
  const row = get<{ n: number }>('SELECT COUNT(*) AS n FROM users');
  return row?.n ?? 0;
}

export function createAdmin(email: string, name: string, password: string): User {
  const id = randomUUID();
  run(
    'INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    id,
    email.trim(),
    name.trim() || 'Admin',
    hashPassword(password),
    'admin',
    new Date().toISOString(),
  );
  const row = get<UserRow>('SELECT * FROM users WHERE id = ?', id)!;
  return toUser(row);
}
