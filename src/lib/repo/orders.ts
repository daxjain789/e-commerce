import 'server-only';
import { randomUUID } from 'node:crypto';
import { all, get, parseJson, run, tx } from '../db';
import { recordMovement } from './products';
import type { Address, Order, OrderItem, OrderStatus, PaymentStatus } from '../types';

interface OrderRow {
  id: string;
  number: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  items: string;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  currency: string;
  status: string;
  payment_provider: string;
  payment_status: string;
  payment_ref: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

function map(row: OrderRow): Order {
  return {
    id: row.id,
    number: row.number,
    email: row.email,
    name: row.name,
    phone: row.phone,
    address: parseJson<Address>(row.address, {
      line1: '',
      city: '',
      postalCode: '',
      country: '',
    }),
    items: parseJson<OrderItem[]>(row.items, []),
    subtotalCents: row.subtotal_cents,
    shippingCents: row.shipping_cents,
    taxCents: row.tax_cents,
    totalCents: row.total_cents,
    currency: row.currency,
    status: row.status as OrderStatus,
    paymentProvider: row.payment_provider,
    paymentStatus: row.payment_status as PaymentStatus,
    paymentRef: row.payment_ref,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class StockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StockError';
  }
}

function nextOrderNumber(): string {
  const row = get<{ n: number }>('SELECT COUNT(*) AS n FROM orders');
  let n = 1001 + (row?.n ?? 0);
  while (get('SELECT 1 AS x FROM orders WHERE number = ?', `MC-${n}`)) n += 1;
  return `MC-${n}`;
}

export interface NewOrderInput {
  email: string;
  name: string;
  phone?: string;
  address: Address;
  items: OrderItem[];
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  paymentProvider: string;
  paymentStatus?: PaymentStatus;
  status?: OrderStatus;
  paymentRef?: string;
  notes?: string;
}

/** Creates the order and reserves stock atomically. */
export function createOrder(input: NewOrderInput): Order {
  return tx(() => {
    // Re-check availability inside the transaction to avoid overselling.
    for (const item of input.items) {
      const row = get<{ stock: number; status: string; name: string }>(
        'SELECT stock, status, name FROM products WHERE id = ?',
        item.productId,
      );
      if (!row || row.status !== 'active') {
        throw new StockError(`${item.name} is no longer available.`);
      }
      if (row.stock < item.quantity) {
        throw new StockError(
          `Only ${row.stock} × ${row.name} left in stock. Please reduce the quantity.`,
        );
      }
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const number = nextOrderNumber();

    run(
      `INSERT INTO orders (id, number, email, name, phone, address, items, subtotal_cents, shipping_cents,
         tax_cents, total_cents, currency, status, payment_provider, payment_status, payment_ref, notes,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      number,
      input.email,
      input.name,
      input.phone ?? '',
      JSON.stringify(input.address),
      JSON.stringify(input.items),
      input.subtotalCents,
      input.shippingCents,
      input.taxCents,
      input.totalCents,
      input.currency,
      input.status ?? 'pending',
      input.paymentProvider,
      input.paymentStatus ?? 'unpaid',
      input.paymentRef ?? '',
      input.notes ?? '',
      now,
      now,
    );

    for (const item of input.items) {
      run(
        'UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?',
        item.quantity,
        now,
        item.productId,
      );
      recordMovement(item.productId, -item.quantity, `Order ${number}`, id, now);
    }

    return getOrderById(id)!;
  });
}

export interface OrderQuery {
  status?: OrderStatus | 'all';
  search?: string;
  limit?: number;
  offset?: number;
}

export function listOrders(query: OrderQuery = {}): Order[] {
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (query.status && query.status !== 'all') {
    clauses.push('status = ?');
    params.push(query.status);
  }
  if (query.search) {
    clauses.push('(number LIKE ? OR email LIKE ? OR name LIKE ?)');
    const term = `%${query.search}%`;
    params.push(term, term, term);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return all<OrderRow>(
    `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    ...params,
    Math.min(query.limit ?? 100, 500),
    query.offset ?? 0,
  ).map(map);
}

export function countOrders(query: OrderQuery = {}): number {
  const row =
    query.status && query.status !== 'all'
      ? get<{ n: number }>('SELECT COUNT(*) AS n FROM orders WHERE status = ?', query.status)
      : get<{ n: number }>('SELECT COUNT(*) AS n FROM orders');
  return row?.n ?? 0;
}

export function getOrderById(id: string): Order | null {
  const row = get<OrderRow>('SELECT * FROM orders WHERE id = ?', id);
  return row ? map(row) : null;
}

export function getOrderByNumber(number: string): Order | null {
  const row = get<OrderRow>('SELECT * FROM orders WHERE number = ?', number.toUpperCase());
  return row ? map(row) : null;
}

function restock(order: Order, reason: string): void {
  const now = new Date().toISOString();
  for (const item of order.items) {
    run('UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?', item.quantity, now, item.productId);
    recordMovement(item.productId, item.quantity, reason, order.id, now);
  }
}

export function updateOrder(
  id: string,
  patch: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    paymentRef?: string;
    notes?: string;
  },
): Order | null {
  return tx(() => {
    const current = getOrderById(id);
    if (!current) return null;

    const status = patch.status ?? current.status;
    const paymentStatus = patch.paymentStatus ?? current.paymentStatus;

    if (status === 'cancelled' && current.status !== 'cancelled') {
      restock(current, `Cancelled order ${current.number}`);
    }
    if (current.status === 'cancelled' && status !== 'cancelled') {
      // Re-reserve stock when an order is reopened.
      for (const item of current.items) {
        const row = get<{ stock: number }>('SELECT stock FROM products WHERE id = ?', item.productId);
        if (!row || row.stock < item.quantity) {
          throw new StockError(`Not enough stock to reopen order ${current.number}.`);
        }
      }
      restock({ ...current, items: current.items.map((i) => ({ ...i, quantity: -i.quantity })) }, `Reopened order ${current.number}`);
    }

    const now = new Date().toISOString();
    run(
      `UPDATE orders SET status = ?, payment_status = ?, payment_ref = ?, notes = ?, updated_at = ? WHERE id = ?`,
      status,
      paymentStatus,
      patch.paymentRef ?? current.paymentRef,
      patch.notes ?? current.notes,
      now,
      id,
    );

    // A fulfilled order is by definition paid.
    if (status === 'fulfilled' && paymentStatus !== 'refunded') {
      run("UPDATE orders SET payment_status = 'paid' WHERE id = ?", id);
    }

    return getOrderById(id);
  });
}

export function markPaid(id: string, paymentRef?: string): Order | null {
  const current = getOrderById(id);
  if (!current) return null;
  run(
    `UPDATE orders SET payment_status = 'paid', status = CASE WHEN status = 'pending' THEN 'paid' ELSE status END,
       payment_ref = ?, updated_at = ? WHERE id = ?`,
    paymentRef ?? current.paymentRef,
    new Date().toISOString(),
    id,
  );
  return getOrderById(id);
}

export interface OrderStats {
  revenueCents: number;
  paidOrders: number;
  totalOrders: number;
  pendingOrders: number;
  averageOrderCents: number;
  unitsSold: number;
}

export function orderStats(): OrderStats {
  const revenue = get<{ n: number; total: number | null }>(
    `SELECT COUNT(*) AS n, COALESCE(SUM(total_cents), 0) AS total FROM orders
      WHERE payment_status = 'paid' AND status != 'cancelled'`,
  );
  const totals = get<{ n: number; total: number | null }>(
    `SELECT COUNT(*) AS n, COALESCE(SUM(total_cents), 0) AS total FROM orders WHERE status != 'cancelled'`,
  );
  const pending = get<{ n: number }>("SELECT COUNT(*) AS n FROM orders WHERE status = 'pending'");
  const paidOrders = revenue?.n ?? 0;
  const revenueCents = revenue?.total ?? 0;
  const totalOrders = totals?.n ?? 0;

  let unitsSold = 0;
  for (const row of all<{ items: string }>("SELECT items FROM orders WHERE payment_status = 'paid' AND status != 'cancelled'")) {
    for (const item of parseJson<OrderItem[]>(row.items, [])) unitsSold += item.quantity;
  }

  return {
    revenueCents,
    paidOrders,
    totalOrders,
    pendingOrders: pending?.n ?? 0,
    averageOrderCents: paidOrders > 0 ? Math.round(revenueCents / paidOrders) : 0,
    unitsSold,
  };
}

export function recentOrders(limit = 6): Order[] {
  return listOrders({ limit });
}
