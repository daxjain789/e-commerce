'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from './ui';
import { adminButtonSecondary } from '@/lib/ui';
import { formatMoney } from '@/lib/money';

interface Row {
  id: string;
  name: string;
  sku: string;
  stock: number;
  priceCents: number;
  status: string;
  image: string;
}

const REASONS = ['Restock', 'Stocktake correction', 'Damaged / write-off', 'Return to stock', 'Sample sent', 'Manual adjustment'];

export function InventoryTable({ products, currency }: { products: Row[]; currency: string }) {
  const router = useRouter();
  const [rows, setRows] = useState(products);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(products.map((product) => [product.id, String(product.stock)])),
  );
  const [reason, setReason] = useState(REASONS[0]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(row: Row) {
    const nextStock = Number(values[row.id]);
    if (!Number.isInteger(nextStock) || nextStock < 0) {
      setError('Stock must be a whole number, zero or more.');
      return;
    }
    setBusy(row.id);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: row.id, stock: nextStock, reason }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || 'Could not update stock.');
      } else {
        setRows((current) => current.map((item) => (item.id === row.id ? { ...item, stock: payload.data.stock } : item)));
        setValues((current) => ({ ...current, [row.id]: String(payload.data.stock) }));
        setMessage(`${row.name}: ${payload.data.stock} in stock.`);
        router.refresh();
      }
    } catch {
      setError('Network error while updating stock.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="admin-label">Reason for these changes</span>
          <select value={reason} onChange={(event) => setReason(event.target.value)} className="admin-input w-auto py-1.5 text-[12.5px]">
            {REASONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <p className="text-[12px] text-muted">Set the counted quantity, then save the row.</p>
      </div>

      {error ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-800">{message}</p>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-hairline bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-hairline text-[10.5px] uppercase tracking-[0.1em] text-muted">
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-3 py-3 font-semibold">Price</th>
                <th className="px-3 py-3 font-semibold">On hand</th>
                <th className="px-3 py-3 font-semibold">Counted</th>
                <th className="px-3 py-3 font-semibold">Change</th>
                <th className="px-5 py-3 text-right font-semibold">Save</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {rows.map((row) => {
                const entered = Number(values[row.id]);
                const delta = Number.isFinite(entered) ? entered - row.stock : 0;
                return (
                  <tr key={row.id} className="transition hover:bg-ink/[0.02]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {row.image ? (
                          <img src={row.image} alt="" className="h-9 w-8 rounded-sm bg-parchment object-cover" />
                        ) : (
                          <div className="h-9 w-8 rounded-sm bg-parchment" />
                        )}
                        <div className="min-w-0">
                          <Link href={`/admin/products/${row.id}`} className="font-medium hover:text-accent">
                            {row.name}
                          </Link>
                          <p className="text-[11px] text-muted">
                            {row.sku || 'No SKU'}
                            {row.status === 'draft' ? ' · draft' : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 tabular-nums text-graphite">{formatMoney(row.priceCents, currency)}</td>
                    <td className="px-3 py-3">
                      <Badge tone={row.stock === 0 ? 'danger' : row.stock <= 5 ? 'warning' : 'neutral'}>{row.stock}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        inputMode="numeric"
                        aria-label={`Counted stock for ${row.name}`}
                        value={values[row.id] ?? ''}
                        onChange={(event) => setValues((current) => ({ ...current, [row.id]: event.target.value }))}
                        className="admin-input w-[84px] py-1.5 tabular-nums"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <span className={delta === 0 ? 'text-muted' : delta > 0 ? 'text-emerald-700' : 'text-red-700'}>
                        {delta === 0 ? '—' : delta > 0 ? `+${delta}` : delta}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => save(row)}
                        disabled={busy === row.id || delta === 0}
                        className={adminButtonSecondary}
                      >
                        {busy === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} /> : null}
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
