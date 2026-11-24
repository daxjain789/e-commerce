'use client';

import Link from 'next/link';
import { Minus, Plus } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { useCart } from './cart-provider';

export function CartView({
  currency,
  flatShippingCents,
  freeShippingThresholdCents,
}: {
  currency: string;
  flatShippingCents: number;
  freeShippingThresholdCents: number;
}) {
  const { lines, ready, subtotalCents, setQuantity, remove } = useCart();

  if (!ready) {
    return <div className="mt-12 h-40 animate-pulse rounded-sm bg-parchment/60" aria-hidden="true" />;
  }

  if (lines.length === 0) {
    return (
      <div className="mt-12 rounded-sm border border-dashed border-hairline px-6 py-20 text-center">
        <p className="font-display text-2xl">Your cart is empty.</p>
        <p className="mx-auto mt-3 max-w-sm text-[14px] text-graphite">
          Ten objects, chosen slowly. Start with the one you would reach for tomorrow morning.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex rounded-full bg-ink px-7 py-3 text-[12px] uppercase tracking-[0.14em] text-paper transition hover:bg-accent"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  const shippingCents =
    freeShippingThresholdCents > 0 && subtotalCents >= freeShippingThresholdCents
      ? 0
      : subtotalCents > 0
        ? flatShippingCents
        : 0;
  const remaining = Math.max(0, freeShippingThresholdCents - subtotalCents);

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_0.6fr] lg:gap-16">
      <div>
        <ul className="divide-y divide-hairline border-y border-hairline">
          {lines.map((line) => (
            <li key={line.productId} className="flex gap-5 py-6">
              <Link href={`/products/${line.slug}`} className="shrink-0">
                {line.image ? (
                  <img src={line.image} alt="" className="h-32 w-24 rounded-sm bg-parchment object-cover" />
                ) : (
                  <div className="h-32 w-24 rounded-sm bg-parchment" />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <Link href={`/products/${line.slug}`} className="text-[15px] hover:text-accent wrap-anywhere">
                    {line.name}
                  </Link>
                  <p className="mt-1 text-[13px] text-graphite">{formatMoney(line.priceCents, currency)} each</p>
                  <button
                    type="button"
                    onClick={() => remove(line.productId)}
                    className="mt-3 text-[11px] uppercase tracking-[0.12em] text-muted transition hover:text-ink"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex items-center gap-6">
                  <div className="inline-flex items-center rounded-full border border-ink/15">
                    <button
                      type="button"
                      onClick={() => setQuantity(line.productId, line.quantity - 1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-ink/5"
                      aria-label={`Decrease quantity of ${line.name}`}
                    >
                      <Minus className="h-3.5 w-3.5" strokeWidth={1.6} />
                    </button>
                    <span className="w-7 text-center text-[13px] tabular-nums">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line.productId, line.quantity + 1)}
                      disabled={line.quantity >= line.max}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-ink/5 disabled:opacity-30"
                      aria-label={`Increase quantity of ${line.name}`}
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={1.6} />
                    </button>
                  </div>
                  <p className="w-20 text-right text-[14px] tabular-nums">
                    {formatMoney(line.priceCents * line.quantity, currency)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Link
          href="/products"
          className="mt-6 inline-flex text-[12px] uppercase tracking-[0.14em] text-graphite transition hover:text-ink"
        >
          ← Continue shopping
        </Link>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-sm border border-hairline bg-white/60 p-6">
          <h2 className="text-[12px] uppercase tracking-[0.16em] text-graphite">Order summary</h2>
          <dl className="mt-5 space-y-3 text-[14px]">
            <div className="flex justify-between">
              <dt className="text-graphite">Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(subtotalCents, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-graphite">Shipping</dt>
              <dd className="tabular-nums">{shippingCents === 0 ? 'Free' : formatMoney(shippingCents, currency)}</dd>
            </div>
            <div className="flex justify-between border-t border-hairline pt-3 text-[15px]">
              <dt>Estimated total</dt>
              <dd className="tabular-nums">{formatMoney(subtotalCents + shippingCents, currency)}</dd>
            </div>
          </dl>
          {remaining > 0 && freeShippingThresholdCents > 0 ? (
            <p className="mt-4 rounded-sm bg-parchment/70 px-3 py-2.5 text-[12px] leading-relaxed text-graphite">
              Add {formatMoney(remaining, currency)} for free shipping.
            </p>
          ) : null}
          <Link
            href="/checkout"
            className="mt-6 flex w-full items-center justify-center rounded-full bg-ink px-6 py-3.5 text-[12px] uppercase tracking-[0.16em] text-paper transition hover:bg-accent"
          >
            Continue to checkout
          </Link>
          <p className="mt-3 text-center text-[11.5px] text-muted">Taxes calculated at checkout.</p>
        </div>
      </aside>
    </div>
  );
}
