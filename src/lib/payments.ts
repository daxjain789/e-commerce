import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Order } from './types';
import type { Settings } from './settings';

export interface PublicProvider {
  id: string;
  label: string;
  instructions: string;
  details: string;
}

const STRIPE_API = 'https://api.stripe.com/v1';

function param(params: URLSearchParams, key: string, value: string | number) {
  params.append(key, String(value));
}

export async function createStripeSession(order: Order, settings: Settings): Promise<string> {
  const secret = settings.payments.stripe.secretKey;
  if (!secret) throw new Error('Stripe is enabled but no secret key is configured in Settings → Payments.');

  const params = new URLSearchParams();
  param(params, 'mode', 'payment');
  param(params, 'customer_email', order.email);
  param(params, 'client_reference_id', order.number);
  param(params, 'metadata[order_id]', order.id);
  param(params, 'metadata[order_number]', order.number);

  const lineItems: { name: string; amount: number; quantity: number }[] = order.items.map((item) => ({
    name: item.name,
    amount: item.priceCents,
    quantity: item.quantity,
  }));
  if (order.shippingCents > 0) lineItems.push({ name: 'Shipping', amount: order.shippingCents, quantity: 1 });
  if (order.taxCents > 0) lineItems.push({ name: 'Tax', amount: order.taxCents, quantity: 1 });

  lineItems.forEach((item, index) => {
    param(params, `line_items[${index}][quantity]`, item.quantity);
    param(params, `line_items[${index}][price_data][currency]`, order.currency.toLowerCase());
    param(params, `line_items[${index}][price_data][unit_amount]`, item.amount);
    param(params, `line_items[${index}][price_data][product_data][name]`, item.name);
  });

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  param(params, 'success_url', `${origin}/checkout/success?order=${order.number}&stripe=1&session_id={CHECKOUT_SESSION_ID}`);
  param(params, 'cancel_url', `${origin}/checkout?cancelled=${order.number}`);

  const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': '2024-06-20',
    },
    body: params.toString(),
    cache: 'no-store',
  });

  const payload: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `Stripe rejected the request (${response.status}).`;
    throw new Error(message);
  }
  return String(payload.url || '');
}

export async function retrieveStripeSession(sessionId: string, secretKey: string): Promise<any | null> {
  if (!sessionId || !secretKey) return null;
  const response = await fetch(`${STRIPE_API}/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  return response.json().catch(() => null);
}

/**
 * Verify a Stripe webhook signature (t=<timestamp>,v1=<signature>).
 * Returns the parsed event or null when the signature is invalid.
 */
export function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  toleranceSeconds = 300,
): any | null {
  if (!header || !secret) return null;
  const parts = header.split(',').reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {});
  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp)) return null;
  if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) return null;

  const expected = createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest('hex');
  const provided = parts.v1 ?? '';
  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(provided))) return null;

  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}
