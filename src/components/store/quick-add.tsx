'use client';

import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { useCart } from './cart-provider';

export function QuickAdd({
  product,
}: {
  product: { productId: string; slug: string; name: string; priceCents: number; image: string; max: number };
}) {
  const { add, setOpen } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        add(product, 1);
        setOpen(true);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1600);
      }}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-paper/95 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink shadow-sm backdrop-blur transition hover:bg-ink hover:text-paper"
    >
      {added ? <Check className="h-3.5 w-3.5" strokeWidth={2} /> : <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />}
      {added ? 'Added' : 'Add to cart'}
    </button>
  );
}
