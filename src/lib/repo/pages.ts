import 'server-only';
import { randomUUID } from 'node:crypto';
import { all, get, parseJson, run } from '../db';
import { uniqueSlug } from '../slug';
import type { Block, Page, PageStatus } from '../types';

interface PageRow {
  id: string;
  slug: string;
  title: string;
  blocks: string;
  status: string;
  seo_title: string;
  seo_description: string;
  updated_at: string;
}

function map(row: PageRow): Page {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    blocks: parseJson<Block[]>(row.blocks, []),
    status: row.status as PageStatus,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    updatedAt: row.updated_at,
  };
}

export function listPages(): Page[] {
  return all<PageRow>('SELECT * FROM pages ORDER BY updated_at DESC').map(map);
}

export function getPageBySlug(slug: string): Page | null {
  const row = get<PageRow>('SELECT * FROM pages WHERE slug = ?', slug);
  return row ? map(row) : null;
}

export function getPageById(id: string): Page | null {
  const row = get<PageRow>('SELECT * FROM pages WHERE id = ?', id);
  return row ? map(row) : null;
}

export function createPage(input: {
  title: string;
  slug?: string;
  blocks?: Block[];
  status?: PageStatus;
  seoTitle?: string;
  seoDescription?: string;
}): Page {
  const id = randomUUID();
  const slug = uniqueSlug(input.slug || input.title, (candidate) =>
    Boolean(get<PageRow>('SELECT id FROM pages WHERE slug = ?', candidate)),
  );
  run(
    `INSERT INTO pages (id, slug, title, blocks, status, seo_title, seo_description, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    slug,
    input.title.trim(),
    JSON.stringify(input.blocks ?? []),
    input.status ?? 'published',
    input.seoTitle ?? '',
    input.seoDescription ?? '',
    new Date().toISOString(),
  );
  return getPageById(id)!;
}

export function updatePage(
  id: string,
  input: {
    title?: string;
    slug?: string;
    blocks?: Block[];
    status?: PageStatus;
    seoTitle?: string;
    seoDescription?: string;
  },
): Page | null {
  const current = getPageById(id);
  if (!current) return null;
  const slug =
    input.slug && input.slug !== current.slug
      ? uniqueSlug(input.slug, (candidate) => {
          const found = get<PageRow>('SELECT id FROM pages WHERE slug = ?', candidate);
          return Boolean(found && found.id !== id);
        })
      : current.slug;
  run(
    `UPDATE pages SET title = ?, slug = ?, blocks = ?, status = ?, seo_title = ?, seo_description = ?, updated_at = ?
     WHERE id = ?`,
    input.title?.trim() || current.title,
    slug,
    JSON.stringify(input.blocks ?? current.blocks),
    input.status ?? current.status,
    input.seoTitle === undefined ? current.seoTitle : input.seoTitle,
    input.seoDescription === undefined ? current.seoDescription : input.seoDescription,
    new Date().toISOString(),
    id,
  );
  return getPageById(id);
}

export function deletePage(id: string): void {
  run('DELETE FROM pages WHERE id = ?', id);
}
