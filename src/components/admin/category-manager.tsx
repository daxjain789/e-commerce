'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { DeleteButton } from './delete-button';
import { adminButtonPrimary, adminButtonSecondary } from '@/lib/ui';

interface Row {
  id: string;
  name: string;
  slug: string;
  description: string;
  position: number;
  productCount: number;
}

export function CategoryManager({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initial);
  const [draft, setDraft] = useState({ name: '', description: '' });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const update = (id: string, patch: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  async function save(row: Row) {
    setBusyId(row.id);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/categories/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: row.name,
          slug: row.slug,
          description: row.description,
          position: row.position,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || 'Could not save the category.');
      } else {
        update(row.id, payload.data);
        setNotice(`Saved “${payload.data.name}”.`);
        router.refresh();
      }
    } catch {
      setError('Network error while saving.');
    } finally {
      setBusyId(null);
    }
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || 'Could not create the category.');
      } else {
        setRows((current) => [...current, { ...payload.data, productCount: 0 }]);
        setDraft({ name: '', description: '' });
        setNotice(`Created “${payload.data.name}”.`);
        router.refresh();
      }
    } catch {
      setError('Network error while creating.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-800">{notice}</p>
      ) : null}

      <section className="rounded-lg border border-hairline bg-white shadow-card">
        <header className="border-b border-hairline px-5 py-4">
          <h2 className="text-[14px] font-medium text-ink">Add a category</h2>
          <p className="mt-0.5 text-[12.5px] text-graphite">Slugs are generated from the name and can be edited afterwards.</p>
        </header>
        <form onSubmit={create} className="grid gap-4 p-5 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
          <label className="block">
            <span className="admin-label">Name</span>
            <input
              required
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              className="admin-input mt-1.5"
              placeholder="Outdoor"
            />
          </label>
          <label className="block">
            <span className="admin-label">Description</span>
            <input
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              className="admin-input mt-1.5"
              placeholder="Shown under the category headline."
            />
          </label>
          <button type="submit" disabled={creating} className={adminButtonPrimary}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Plus className="h-4 w-4" strokeWidth={2} />}
            Create
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-hairline bg-white shadow-card">
        <header className="border-b border-hairline px-5 py-4">
          <h2 className="text-[14px] font-medium text-ink">All categories</h2>
          <p className="mt-0.5 text-[12.5px] text-graphite">Edit inline, then save. Position controls the order in the filter bar.</p>
        </header>
        <div className="divide-y divide-hairline">
          {rows.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-graphite">No categories yet.</p>
          ) : null}
          {rows.map((row) => (
            <div key={row.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1fr_1fr_1.4fr_90px_auto] lg:items-end">
              <label className="block">
                <span className="admin-label">Name</span>
                <input value={row.name} onChange={(event) => update(row.id, { name: event.target.value })} className="admin-input mt-1" />
              </label>
              <label className="block">
                <span className="admin-label">Slug</span>
                <input value={row.slug} onChange={(event) => update(row.id, { slug: event.target.value })} className="admin-input mt-1" />
              </label>
              <label className="block">
                <span className="admin-label">Description</span>
                <input
                  value={row.description}
                  onChange={(event) => update(row.id, { description: event.target.value })}
                  className="admin-input mt-1"
                />
              </label>
              <label className="block">
                <span className="admin-label">Order</span>
                <input
                  type="number"
                  value={row.position}
                  onChange={(event) => update(row.id, { position: Number(event.target.value) })}
                  className="admin-input mt-1"
                />
              </label>
              <div className="flex items-center justify-end gap-2">
                <span className="mr-1 text-[11px] text-muted">{row.productCount} {row.productCount === 1 ? 'product' : 'products'}</span>
                <button type="button" onClick={() => save(row)} disabled={busyId === row.id} className={adminButtonSecondary}>
                  {busyId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} /> : null}
                  Save
                </button>
                <DeleteButton endpoint={`/api/categories/${row.id}`} label="Delete" confirmLabel="Sure?" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
