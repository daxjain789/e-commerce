import { requireApiUser, fail, json, readJson } from '@/lib/http';
import { StockError, getOrderById, updateOrder } from '@/lib/repo/orders';
import type { OrderStatus, PaymentStatus } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUSES: OrderStatus[] = ['pending', 'paid', 'fulfilled', 'cancelled', 'refunded'];
const PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'pending', 'paid', 'refunded', 'failed'];

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiUser();
  if (response) return response;
  const { id } = await params;
  const order = getOrderById(id);
  if (!order) return fail('Order not found.', 404);
  return json({ data: order });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiUser();
  if (response) return response;
  const { id } = await params;
  const body = await readJson<Record<string, unknown>>(request);

  if (body.status !== undefined && !STATUSES.includes(body.status as OrderStatus)) {
    return fail(`Status must be one of: ${STATUSES.join(', ')}.`, 422);
  }
  if (body.paymentStatus !== undefined && !PAYMENT_STATUSES.includes(body.paymentStatus as PaymentStatus)) {
    return fail(`Payment status must be one of: ${PAYMENT_STATUSES.join(', ')}.`, 422);
  }

  try {
    const order = updateOrder(id, {
      status: body.status as OrderStatus | undefined,
      paymentStatus: body.paymentStatus as PaymentStatus | undefined,
      notes: body.notes === undefined ? undefined : String(body.notes).slice(0, 2000),
    });
    if (!order) return fail('Order not found.', 404);
    return json({ data: order });
  } catch (error) {
    if (error instanceof StockError) return fail(error.message, 409);
    return fail('Could not update the order.', 500);
  }
}
