'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/ui';

export function DeleteButton({
  endpoint,
  label = 'Delete',
  redirectTo,
  className,
  confirmLabel = 'Confirm delete',
}: {
  endpoint: string;
  label?: string;
  redirectTo?: string;
  className?: string;
  confirmLabel?: string;
}) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(endpoint, { method: 'DELETE' });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.error || 'Could not delete.');
        setBusy(false);
        setArmed(false);
        return;
      }
      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch {
      setError('Network error.');
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => (armed ? remove() : setArmed(true))}
        onBlur={() => window.setTimeout(() => setArmed(false), 2500)}
        disabled={busy}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition',
          armed
            ? 'border-red-400 bg-red-600 text-white hover:bg-red-700'
            : 'border-hairline bg-white text-graphite hover:border-red-300 hover:text-red-700',
          className,
        )}
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.7} />
        {busy ? 'Deleting…' : armed ? confirmLabel : label}
      </button>
      {error ? <span className="text-[11px] text-red-600">{error}</span> : null}
    </span>
  );
}
