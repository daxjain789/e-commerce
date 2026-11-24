import 'server-only';
import { randomUUID } from 'node:crypto';
import { all, get, run } from '../db';
import { uniqueSlug } from '../slug';
import type { Category } from '../types';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  position: number;
  product_count?: number;
}

function map(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image: row.image,
    position: row.position,
    productCount: row.product_count ?? 0,
  };
}

export function listCategories(): Category[] {
  return all<CategoryRow>(
    `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'active') AS product_count
     FROM categories c ORDER BY c.position ASC, c.name ASC`,
  ).map(map);
}

export function getCategoryBySlug(slug: string): Category | null {
  const row = get<CategoryRow>('SELECT * FROM categories WHERE slug = ?', slug);
  return row ? map(row) : null;
}

export function createCategory(input: {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  position?: number;
}): Category {
  const id = randomUUID();
  const slug = uniqueSlug(input.slug || input.name, (candidate) =>
    Boolean(get<CategoryRow>('SELECT id FROM categories WHERE slug = ?', candidate)),
  );
  const position =
    input.position ??
    (get<{ p: number | null }>('SELECT MAX(position) AS p FROM categories')?.p ?? 0) + 1;
  run(
    'INSERT INTO categories (id, name, slug, description, image, position) VALUES (?, ?, ?, ?, ?, ?)',
    id,
    input.name.trim(),
    slug,
    input.description ?? '',
    input.image ?? '',
    position,
  );
  const row = get<CategoryRow>('SELECT * FROM categories WHERE id = ?', id);
  if (!row) throw new Error('Category insert failed');
  return map(row);
}

export function updateCategory(
  id: string,
  input: { name?: string; slug?: string; description?: string; image?: string; position?: number },
): Category | null {
  const current = get<CategoryRow>('SELECT * FROM categories WHERE id = ?', id);
  if (!current) return null;
  const slug =
    input.slug && input.slug !== current.slug
      ? uniqueSlug(input.slug, (candidate) => {
          const found = get<CategoryRow>('SELECT id FROM categories WHERE slug = ?', candidate);
          return Boolean(found && found.id !== id);
        })
      : current.slug;
  run(
    'UPDATE categories SET name = ?, slug = ?, description = ?, image = ?, position = ? WHERE id = ?',
    input.name?.trim() || current.name,
    slug,
    input.description ?? current.description,
    input.image ?? current.image,
    input.position ?? current.position,
    id,
  );
  return map(get<CategoryRow>('SELECT * FROM categories WHERE id = ?', id)!);
}

export function deleteCategory(id: string): void {
  run('DELETE FROM categories WHERE id = ?', id);
}
