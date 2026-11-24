'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, Loader2, RotateCcw, XCircle } from 'lucide-react';
import { Card } from './ui';
import { adminButtonPrimary, adminButtonSecondary, cn } from '@/lib/ui';

interface OrderState {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  paymentProvider: string;
  paymentRef: string;
  notes: string;
}

const STATUSES = ['pending', 'paid', 'fulfilled', 'cancelled', 'refunded'];
const PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'refunded', 'failed'];

export function OrderPanel({ order, providerLabel }: { order: OrderState; providerLabel: string }) {
  const router = useRouter();
  const [state, setState] = useState({
    status: order.status,
    paymentStatus: order.paymentStatus,
    notes: order.notes,
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function patch(payload: Record<string, unknown>, key = 'save') {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error || 'Could not update the order.');
      } else {
        setState({
          status: body.data.status,
          paymentStatus: body.data.paymentStatus,
          notes: body.data.notes,
        });
        setNotice('Order updated.');
        router.refresh();
      }
    } catch {
      setError('Network error while updating the order.');
    } finally {
      setBusy(null);
    }
  }

  const cancelArmed = state.status === 'cancelled';

  return (
    <div className="space-y-5">
      <Card title="Fulfilment" description="Status changes are logged and stock is adjusted automatically.">
        <div className="space-y-4">
          {error ? (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-800">
              {notice}
            </p>
          ) : null}

          <label className="block">
            <span className="admin-label">Order status</span>
            <select
              value={state.status}
              onChange={(event) => setState((current) => ({ ...current, status: event.target.value }))}
              className="admin-input mt-1.5"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="admin-label">Payment status</span>
            <select
              value={state.paymentStatus}
              onChange={(event) => setState((current) => ({ ...current, paymentStatus: event.target.value }))}
              className="admin-input mt-1.5"
            >
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="admin-label">Internal note</span>
            <textarea
              value={state.notes}
              onChange={(event) => setState((current) => ({ ...current, notes: event.target.value }))}
              rows={3}
              className="admin-input mt-1.5 resize-y"
              placeholder="Not visible to the customer."
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => patch({ status: state.status, paymentStatus: state.paymentStatus, notes: state.notes })}
              disabled={busy !== null}
              className={cn(adminButtonPrimary, 'flex-1')}
            >
              {busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : null}
              Save changes
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-hairline pt-4">
            <button
              type="button"
              onClick={() => patch({ paymentStatus: 'paid', status: state.status === 'pending' ? 'paid' : state.status }, 'paid')}
              disabled={busy !== null || state.paymentStatus === 'paid'}
              className={adminButtonSecondary}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={1.8} />
              Mark paid
            </button>
            <button
              type="button"
              onClick={() => patch({ status: 'fulfilled' }, 'fulfil')}
              disabled={busy !== null || state.status === 'fulfilled'}
              className={adminButtonSecondary}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={1.8} />
              Fulfil
            </button>
            <button
              type="button"
              onClick={() => patch({ status: 'pending' }, 'reopen')}
              disabled={busy !== null || state.status === 'pending'}
              className={adminButtonSecondary}
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} />
              Reopen
            </button>
            <button
              type="button"
              onClick={() =>
                cancelArmed
                  ? patch({ status: 'cancelled' }, 'cancel')
                  : setState((current) => ({ ...current, status: 'cancelled' }))
              }
              disabled={busy !== null}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition',
                cancelArmed
                  ? 'border-red-500 bg-red-600 text-white hover:bg-red-700'
                  : 'border-red-200 bg-white text-red-700 hover:border-red-400',
              )}
            >
              {busy === 'cancel' ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} /> : <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />}
              {cancelArmed ? 'Confirm cancel' : 'Cancel order'}
            </button>
          </div>
          {cancelArmed ? (
            <p className="text-[11.5px] leading-relaxed text-red-700">
              Cancelling returns every item to stock. Select “Reopen” to undo before saving.
            </p>
          ) : null}
        </div>
      </Card>

      <Card title="Payment">
        <dl className="space-y-2.5 text-[12.5px]">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Method</dt>
            <dd className="text-right text-ink">{providerLabel}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Provider id</dt>
            <dd className="text-right text-ink">{order.paymentProvider}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Reference</dt>
            <dd className="max-w-[190px] truncate text-right text-ink">{order.paymentRef || '—'}</dd>
          </div>
        </dl>
        <p className="mt-4 text-[11.5px] leading-relaxed text-muted">
          Card payments are confirmed by the Stripe webhook. Bank transfers and cash on delivery are confirmed by hand.
        </p>
      </Card>
    </div>
  );
}
