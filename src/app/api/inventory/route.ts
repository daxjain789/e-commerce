import { requireApiUser, fail, json, readJson } from '@/lib/http';
import { all } from '@/lib/db';
import { getProductById, setStock } from '@/lib/repo/products';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { response } = await requireApiUser();
  if (response) return response;
  const productId = new URL(request.url).searchParams.get('product');
  const movements = all(
    `SELECT m.*, p.name AS product_name FROM stock_movements m
      JOIN products p ON p.id = m.product_id
      ${productId ? 'WHERE m.product_id = ?' : ''}
      ORDER BY m.created_at DESC LIMIT 100`,
    ...(productId ? [productId] : []),
  ).map((m: any) => ({
    id: m.id,
    productId: m.product_id,
    productName: m.product_name,
    delta: m.delta,
    reason: m.reason,
    orderId: m.order_id,
    createdAt: m.created_at,
  }));
  return json({ data: movements });
}

export async function POST(request: Request) {
  const { response } = await requireApiUser();
  if (response) return response;
  const body = await readJson<Record<string, unknown>>(request);
  const productId = String(body.productId ?? '');
  const stock = Number(body.stock);
  const reason = String(body.reason ?? '').slice(0, 200);

  if (!productId) return fail('productId is required.', 422);
  if (!Number.isInteger(stock) || stock < 0) return fail('Stock must be a whole number, 0 or more.', 422);
  if (!getProductById(productId)) return fail('Product not found.', 404);

  const product = setStock(productId, stock, reason || 'Inventory update');
  return json({ data: product });
}
