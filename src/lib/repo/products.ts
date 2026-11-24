import 'server-only';
import { randomUUID } from 'node:crypto';
import { all, get, parseJson, run } from '../db';
import { uniqueSlug } from '../slug';
import type { Product, ProductStatus } from '../types';

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_cents: number;
  compare_at_cents: number | null;
  sku: string;
  stock: number;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  images: string;
  status: string;
  featured: number;
  created_at: string;
  updated_at: string;
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    priceCents: row.price_cents,
    compareAtCents: row.compare_at_cents,
    sku: row.sku,
    stock: row.stock,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    images: parseJson<string[]>(row.images, []),
    status: row.status as ProductStatus,
    featured: Boolean(row.featured),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT = `SELECT p.*, c.name AS category_name, c.slug AS category_slug
  FROM products p LEFT JOIN categories c ON c.id = p.category_id`;

export interface ProductQuery {
  search?: string;
  categorySlug?: string;
  status?: ProductStatus | 'all';
  featuredOnly?: boolean;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'name' | 'stock';
  limit?: number;
  offset?: number;
}

function where(query: ProductQuery) {
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (query.search) {
    clauses.push('(p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)');
    const term = `%${query.search}%`;
    params.push(term, term, term);
  }
  if (query.categorySlug) {
    clauses.push('c.slug = ?');
    params.push(query.categorySlug);
  }
  if (query.status && query.status !== 'all') {
    clauses.push('p.status = ?');
    params.push(query.status);
  }
  if (query.featuredOnly) clauses.push('p.featured = 1');
  return { sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

const ORDER_BY: Record<string, string> = {
  newest: 'p.created_at DESC',
  'price-asc': 'p.price_cents ASC',
  'price-desc': 'p.price_cents DESC',
  name: 'p.name ASC',
  stock: 'p.stock ASC',
};

export function listProducts(query: ProductQuery = {}): Product[] {
  const { sql, params } = where(query);
  const order = ORDER_BY[query.sort ?? 'newest'] ?? ORDER_BY.newest;
  const limit = Math.min(Math.max(query.limit ?? 100, 1), 500);
  const rows = all<ProductRow>(
    `${SELECT} ${sql} ORDER BY ${order} LIMIT ? OFFSET ?`,
    ...params,
    limit,
    query.offset ?? 0,
  );
  return rows.map(mapProduct);
}

export function countProducts(query: ProductQuery = {}): number {
  const { sql, params } = where(query);
  const row = get<{ n: number }>(
    `SELECT COUNT(*) AS n FROM products p LEFT JOIN categories c ON c.id = p.category_id ${sql}`,
    ...params,
  );
  return row?.n ?? 0;
}

export function getProductById(id: string): Product | null {
  const row = get<ProductRow>(`${SELECT} WHERE p.id = ?`, id);
  return row ? mapProduct(row) : null;
}

export function getProductBySlug(slug: string): Product | null {
  const row = get<ProductRow>(`${SELECT} WHERE p.slug = ?`, slug);
  return row ? mapProduct(row) : null;
}

export function getFeaturedProducts(limit = 4): Product[] {
  const rows = all<ProductRow>(
    `${SELECT} WHERE p.status = 'active' AND p.featured = 1 ORDER BY p.created_at DESC LIMIT ?`,
    limit,
  );
  if (rows.length > 0) return rows.map(mapProduct);
  return listProducts({ status: 'active', limit });
}

export function relatedProducts(product: Product, limit = 4): Product[] {
  const rows = all<ProductRow>(
    `${SELECT} WHERE p.status = 'active' AND p.id != ?
      AND (p.category_id = ? OR ? IS NULL)
      ORDER BY p.created_at DESC LIMIT ?`,
    product.id,
    product.categoryId,
    product.categoryId,
    limit,
  );
  return rows.map(mapProduct);
}

export interface ProductInput {
  name: string;
  slug?: string;
  description?: string;
  priceCents: number;
  compareAtCents?: number | null;
  sku?: string;
  stock?: number;
  categoryId?: string | null;
  images?: string[];
  status?: ProductStatus;
  featured?: boolean;
}

export function createProduct(input: ProductInput): Product {
  const id = randomUUID();
  const now = new Date().toISOString();
  const slug = uniqueSlug(input.slug || input.name, (candidate) => Boolean(getProductBySlug(candidate)));
  run(
    `INSERT INTO products (id, name, slug, description, price_cents, compare_at_cents, sku, stock,
       category_id, images, status, featured, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.name.trim(),
    slug,
    input.description ?? '',
    input.priceCents,
    input.compareAtCents ?? null,
    input.sku ?? '',
    input.stock ?? 0,
    input.categoryId || null,
    JSON.stringify(input.images ?? []),
    input.status ?? 'active',
    input.featured ? 1 : 0,
    now,
    now,
  );
  if (input.stock && input.stock > 0) {
    recordMovement(id, input.stock, 'Initial stock', null);
  }
  return getProductById(id)!;
}

export function updateProduct(id: string, input: Partial<ProductInput>): Product | null {
  const current = getProductById(id);
  if (!current) return null;

  const next = {
    name: input.name ?? current.name,
    slug:
      input.slug && input.slug !== current.slug
        ? uniqueSlug(input.slug, (candidate) => {
            const existing = getProductBySlug(candidate);
            return Boolean(existing && existing.id !== id);
          })
        : current.slug,
    description: input.description ?? current.description,
    priceCents: input.priceCents ?? current.priceCents,
    compareAtCents: input.compareAtCents === undefined ? current.compareAtCents : input.compareAtCents,
    sku: input.sku ?? current.sku,
    stock: input.stock ?? current.stock,
    categoryId: input.categoryId === undefined ? current.categoryId : input.categoryId || null,
    images: input.images ?? current.images,
    status: input.status ?? current.status,
    featured: input.featured === undefined ? current.featured : input.featured,
  };

  run(
    `UPDATE products SET name = ?, slug = ?, description = ?, price_cents = ?, compare_at_cents = ?,
       sku = ?, stock = ?, category_id = ?, images = ?, status = ?, featured = ?, updated_at = ?
     WHERE id = ?`,
    next.name,
    next.slug,
    next.description,
    next.priceCents,
    next.compareAtCents,
    next.sku,
    next.stock,
    next.categoryId,
    JSON.stringify(next.images),
    next.status,
    next.featured ? 1 : 0,
    new Date().toISOString(),
    id,
  );

  if (next.stock !== current.stock) {
    recordMovement(id, next.stock - current.stock, 'Adjusted in product editor', null);
  }
  return getProductById(id);
}

export function deleteProduct(id: string): void {
  run('DELETE FROM products WHERE id = ?', id);
}

export function recordMovement(
  productId: string,
  delta: number,
  reason: string,
  orderId: string | null,
  at?: string,
): void {
  if (delta === 0) return;
  run(
    'INSERT INTO stock_movements (id, product_id, delta, reason, order_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    randomUUID(),
    productId,
    delta,
    reason,
    orderId,
    at ?? new Date().toISOString(),
  );
}

/** Set stock to an absolute value and record the movement. */
export function setStock(productId: string, newStock: number, reason: string): Product | null {
  const product = getProductById(productId);
  if (!product) return null;
  const delta = newStock - product.stock;
  run('UPDATE products SET stock = ?, updated_at = ? WHERE id = ?', newStock, new Date().toISOString(), productId);
  recordMovement(productId, delta, reason || 'Inventory update', null);
  return getProductById(productId);
}

export function lowStockProducts(threshold = 5): Product[] {
  return all<ProductRow>(
    `${SELECT} WHERE p.status = 'active' AND p.stock <= ? ORDER BY p.stock ASC LIMIT 50`,
    threshold,
  ).map(mapProduct);
}

export function stockValueCents(): number {
  const row = get<{ v: number | null }>('SELECT SUM(price_cents * stock) AS v FROM products WHERE status = ?', 'active');
  return row?.v ?? 0;
}
