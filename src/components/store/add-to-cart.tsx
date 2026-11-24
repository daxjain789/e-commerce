'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useCart } from './cart-provider';

export function AddToCart({
  product,
  stock,
}: {
  product: { productId: string; slug: string; name: string; priceCents: number; image: string; max: number };
  stock: number;
}) {
  const { add, setOpen } = useCart();
  const [quantity, setQuantity] = useState(1);
  const soldOut = stock <= 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-[12px] uppercase tracking-[0.14em] text-graphite">
          {soldOut ? 'Sold out' : stock <= 5 ? `Only ${stock} left` : 'In stock'}
        </span>
        {!soldOut ? (
          <div className="inline-flex items-center rounded-full border border-ink/15">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              disabled={quantity <= 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-ink/5 disabled:opacity-30"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={1.6} />
            </button>
            <span className="w-8 text-center text-[14px] tabular-nums" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.min(stock, value + 1))}
              disabled={quantity >= stock}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-ink/5 disabled:opacity-30"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.6} />
            </button>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        disabled={soldOut}
        onClick={() => {
          add(product, quantity);
          setOpen(true);
          setQuantity(1);
        }}
        className="flex w-full items-center justify-center rounded-full bg-ink px-8 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-paper transition hover:bg-accent disabled:cursor-not-allowed disabled:bg-ink/30"
      >
        {soldOut ? 'Notify me when back' : 'Add to cart'}
      </button>
    </div>
  );
}
