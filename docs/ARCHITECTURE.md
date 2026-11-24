# Architecture

## Request flow

```
Browser ──▶ Next.js App Router
              ├─ (store)/*  server components ──▶ src/lib/repo/* ──▶ node:sqlite (data/store.db)
              ├─ admin/*    server components ──▶ requireUser() ─▶ repo
              └─ api/*      route handlers  ──▶ validation ──▶ repo ──▶ repo/payments
```

Every page that reads the catalogue or CMS is `dynamic = 'force-dynamic'`; there is no build-
time snapshot of the store, so admin edits appear on the next request. Cart state is the only
thing that lives in the browser (localStorage key `meridian.cart.v1`).

## Data model

| Table | Holds |
| --- | --- |
| `settings` | Key/value JSON: branding, currency, shipping, navigation, payments (incl. secrets) |
| `users`, `sessions` | Admin accounts (scrypt hashes) and server-side sessions |
| `categories` | Name, slug, description, image, sort position |
| `products` | Price/compare-at in cents, SKU, stock, JSON images, status, featured flag |
| `pages` | Slug, title, JSON blocks, status, SEO fields |
| `orders` | Customer, address JSON, items JSON (price snapshot), money, status, provider |
| `stock_movements` | Append-only ledger: delta, reason, order id, timestamp |

Orders snapshot product name/price/image at purchase time, so later catalogue edits never
rewrite history. Cancelling an order writes the inverse movements back to the ledger.

## Why SQLite

One file, no service, instant local development, and more than enough for a small shop
(hundreds of thousands of reads/day). The trade-off is a single writer: run one instance per
database and keep writes short. All stock-affecting writes already run inside
`BEGIN IMMEDIATE` transactions.

**Moving to Postgres:** replace `src/lib/db.ts` (connection + schema) and the SQL in
`src/lib/repo/*`. The repository functions are the only place that know about SQL; routes and
components speak in the domain types from `src/lib/types.ts`. Keep the transaction boundaries
in `createOrder` and `updateOrder` — they prevent overselling.

## Money

All amounts are integer cents (`priceCents`, `totalCents`, …). `src/lib/money.ts` formats for
display and parses human input. Never do arithmetic on formatted strings, and never let the
client decide a total: `POST /api/checkout` recomputes everything.

## CMS blocks

`src/lib/blocks.ts` is the single source of truth for block types and their fields. The admin
editor renders forms from those definitions; the storefront renderer switches on `block.type`.
Unknown types render nothing, so deleting a block type degrades safely.

## Auth

`requireUser()` (server components) and `requireApiUser()` (route handlers) are the two guards.
The admin layout renders the shell only when a session exists; each page also calls
`requireUser()` so a missing layout guard can never leak data. Sessions expire after 14 days and
are stored hashed-by-randomness (32 random bytes) in the `sessions` table.
