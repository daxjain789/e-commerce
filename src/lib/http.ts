import { NextResponse } from 'next/server';
import { getCurrentUser } from './auth';

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Guard for admin API routes: returns the user or a 401 response. */
export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) return { user: null, response: fail('Unauthorized', 401) };
  return { user, response: null };
}

export async function readJson<T = any>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

export function absoluteUrl(path: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  const base = configured && configured.length > 0 ? configured : 'http://localhost:3000';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
