'use client';

import Link from 'next/link';
import { Minus, Plus, X } from 'lucide-react';
import { useCart } from './cart-provider';
import { formatMoney } from '@/lib/money';

export function CartDrawer() {
  const { open, setOpen, lines, subtotalCents, setQuantity, remove, ready } = useCart();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default bg-ink/35 backdrop-blur-[2px]"
        onClick={() => setOpen(false)}
        aria-label="Close cart"
        tabIndex={-1}
      />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-[430px] flex-col bg-paper shadow-lift">
        <div className="flex items-center justify-between border-b border-hairline px-6 py-5">
          <div>
            <p className="eyebrow">Your cart</p>
            <p className="mt-1 text-[13px] text-graphite">
              {ready ? `${lines.length} ${lines.length === 1 ? 'item' : 'items'}` : 'Loading…'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-ink transition hover:bg-ink hover:text-paper"
            aria-label="Close cart"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {ready && lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-20 text-center">
              <p className="font-display text-2xl">Nothing in here yet.</p>
              <p className="max-w-[240px] text-[14px] text-graphite">
                The catalogue is short on purpose. Start with something you will use tomorrow.
              </p>
              <Link
                href="/products"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex rounded-full bg-ink px-6 py-2.5 text-[12px] uppercase tracking-[0.14em] text-paper transition hover:bg-accent"
              >
                Browse the shop
              </Link>
            </div>
          ) : null}

          <ul className="divide-y divide-hairline">
            {lines.map((line) => (
              <li key={line.productId} className="flex gap-4 py-5">
                <Link href={`/products/${line.slug}`} onClick={() => setOpen(false)} className="shrink-0">
                  {line.image ? (
                    <img
                      src={line.image}
                      alt=""
                      className="h-[92px] w-[76px] rounded-sm bg-parchment object-cover"
                    />
                  ) : (
                    <div className="h-[92px] w-[76px] rounded-sm bg-parchment" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/products/${line.slug}`}
                      onClick={() => setOpen(false)}
                      className="line-clamp-2 text-[14px] leading-snug hover:text-accent wrap-anywhere"
                    >
                      {line.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(line.productId)}
                      className="shrink-0 text-[11px] uppercase tracking-[0.1em] text-muted transition hover:text-ink"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="mt-1 text-[13px] text-graphite">{formatMoney(line.priceCents)}</p>
                  <div className="mt-3 inline-flex items-center rounded-full border border-ink/15">
                    <button
                      type="button"
                      onClick={() => setQuantity(line.productId, line.quantity - 1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink transition hover:bg-ink/5"
                      aria-label={`Decrease quantity of ${line.name}`}
                    >
                      <Minus className="h-3.5 w-3.5" strokeWidth={1.6} />
                    </button>
                    <span className="w-7 text-center text-[13px] tabular-nums" aria-live="polite">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line.productId, line.quantity + 1)}
                      disabled={line.quantity >= line.max}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink transition hover:bg-ink/5 disabled:opacity-30"
                      aria-label={`Increase quantity of ${line.name}`}
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={1.6} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {lines.length > 0 ? (
          <div className="border-t border-hairline px-6 py-6">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] uppercase tracking-[0.12em] text-graphite">Subtotal</span>
              <span className="font-display text-2xl tabular-nums">{formatMoney(subtotalCents)}</span>
            </div>
            <p className="mt-2 text-[12px] text-muted">Shipping and tax calculated at checkout.</p>
            <div className="mt-5 space-y-2.5">
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-full bg-ink px-6 py-3.5 text-[12px] uppercase tracking-[0.16em] text-paper transition hover:bg-accent"
              >
                Checkout
              </Link>
              <Link
                href="/cart"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-full border border-ink/20 px-6 py-3 text-[12px] uppercase tracking-[0.16em] text-ink transition hover:border-ink"
              >
                View cart
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
