import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { seedDatabase } from './seed';

const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
  : path.join(process.cwd(), 'data', 'store.db');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  image       TEXT NOT NULL DEFAULT '',
  position    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  description      TEXT NOT NULL DEFAULT '',
  price_cents      INTEGER NOT NULL,
  compare_at_cents INTEGER,
  sku              TEXT NOT NULL DEFAULT '',
  stock            INTEGER NOT NULL DEFAULT 0,
  category_id      TEXT REFERENCES categories(id) ON DELETE SET NULL,
  images           TEXT NOT NULL DEFAULT '[]',
  status           TEXT NOT NULL DEFAULT 'active',
  featured         INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pages (
  id              TEXT PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  blocks          TEXT NOT NULL DEFAULT '[]',
  status          TEXT NOT NULL DEFAULT 'published',
  seo_title       TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  updated_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,
  number          TEXT NOT NULL UNIQUE,
  email           TEXT NOT NULL,
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL DEFAULT '',
  address         TEXT NOT NULL DEFAULT '{}',
  items           TEXT NOT NULL DEFAULT '[]',
  subtotal_cents  INTEGER NOT NULL,
  shipping_cents  INTEGER NOT NULL DEFAULT 0,
  tax_cents       INTEGER NOT NULL DEFAULT 0,
  total_cents     INTEGER NOT NULL,
  currency        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  payment_provider TEXT NOT NULL DEFAULT 'cod',
  payment_status  TEXT NOT NULL DEFAULT 'unpaid',
  payment_ref     TEXT NOT NULL DEFAULT '',
  notes           TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id         TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  delta      INTEGER NOT NULL,
  reason     TEXT NOT NULL DEFAULT '',
  order_id   TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_id, created_at DESC);
`;

type GlobalWithDb = typeof globalThis & { __meridianDb?: DatabaseSync };

export function db(): DatabaseSync {
  const g = globalThis as GlobalWithDb;
  if (g.__meridianDb) return g.__meridianDb;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const database = new DatabaseSync(DB_PATH);
  database.exec('PRAGMA journal_mode = WAL;');
  database.exec('PRAGMA foreign_keys = ON;');
  database.exec('PRAGMA busy_timeout = 5000;');
  database.exec(SCHEMA);

  g.__meridianDb = database;
  seedDatabase(database);
  return database;
}

function clean(params: unknown[]): any[] {
  return params.map((p) => {
    if (p === undefined) return null;
    if (typeof p === 'boolean') return p ? 1 : 0;
    return p;
  });
}

export function all<T = any>(sql: string, ...params: unknown[]): T[] {
  return db().prepare(sql).all(...clean(params)) as T[];
}

export function get<T = any>(sql: string, ...params: unknown[]): T | undefined {
  return db().prepare(sql).get(...clean(params)) as T | undefined;
}

export function run(sql: string, ...params: unknown[]) {
  return db().prepare(sql).run(...clean(params));
}

export function tx<T>(fn: () => T): T {
  const database = db();
  database.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    database.exec('COMMIT');
    return result;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}
