'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  image: string;
  quantity: number;
  max: number;
}

interface CartApi {
  lines: CartLine[];
  ready: boolean;
  open: boolean;
  count: number;
  subtotalCents: number;
  setOpen: (open: boolean) => void;
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

const STORAGE_KEY = 'meridian.cart.v1';
const CartContext = createContext<CartApi | null>(null);

function sanitise(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((line): line is CartLine => Boolean(line && typeof line === 'object' && 'productId' in line))
    .map((line) => ({
      productId: String(line.productId),
      slug: String(line.slug ?? ''),
      name: String(line.name ?? ''),
      priceCents: Number(line.priceCents) || 0,
      image: String(line.image ?? ''),
      quantity: Math.max(1, Math.round(Number(line.quantity) || 1)),
      max: Math.max(1, Math.round(Number(line.max) || 99)),
    }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(sanitise(JSON.parse(raw)));
    } catch {
      /* ignore malformed carts */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage may be full or blocked */
    }
  }, [lines, ready]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const add = useCallback((line: Omit<CartLine, 'quantity'>, quantity = 1) => {
    setLines((current) => {
      const existing = current.find((item) => item.productId === line.productId);
      if (existing) {
        return current.map((item) =>
          item.productId === line.productId
            ? { ...item, ...line, quantity: Math.min(item.quantity + quantity, line.max) }
            : item,
        );
      }
      return [...current, { ...line, quantity: Math.min(quantity, line.max) }];
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((current) => current.filter((line) => line.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((current) =>
      current
        .map((line) =>
          line.productId === productId
            ? { ...line, quantity: Math.max(0, Math.min(quantity, line.max)) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartApi>(() => {
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotalCents = lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
    return { lines, ready, open, count, subtotalCents, setOpen, add, remove, setQuantity, clear };
  }, [lines, ready, open, add, remove, setQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
