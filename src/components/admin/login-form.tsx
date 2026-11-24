'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || 'Sign in failed.');
        setSubmitting(false);
        return;
      }
      router.push('/admin');
      router.refresh();
    } catch {
      setError('Network error. Try again.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="text-[10.5px] uppercase tracking-[0.16em] text-paper/45">Email</span>
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1.5 w-full rounded-md border border-paper/15 bg-[#14120f] px-3 py-2.5 text-[14px] text-paper outline-none transition placeholder:text-paper/25 focus:border-paper/40 focus:ring-2 focus:ring-accent/30"
          placeholder="admin@example.com"
        />
      </label>
      <label className="block">
        <span className="text-[10.5px] uppercase tracking-[0.16em] text-paper/45">Password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1.5 w-full rounded-md border border-paper/15 bg-[#14120f] px-3 py-2.5 text-[14px] text-paper outline-none transition placeholder:text-paper/25 focus:border-paper/40 focus:ring-2 focus:ring-accent/30"
          placeholder="••••••••"
        />
      </label>

      {error ? (
        <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12.5px] text-red-200">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-paper px-4 py-2.5 text-[12px] font-medium uppercase tracking-[0.14em] text-ink transition hover:bg-accent hover:text-white disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} /> : null}
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
