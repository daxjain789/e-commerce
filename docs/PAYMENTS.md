# Payments

Meridian Commerce ships with three providers and a small seam for adding your own.

## How checkout works

1. `POST /api/checkout` validates the cart against the database, recomputes subtotal,
   shipping and tax, and writes the order plus a stock reservation in one SQLite transaction.
2. If the provider is `cod` or `bank`, the customer is sent to
   `/checkout/success?order=MC-1004` with instructions. The admin marks the order paid later.
3. If the provider is `stripe`, the API creates a Stripe Checkout Session and returns its URL.
   If Stripe fails, the order is cancelled and the stock is released before the error is shown.
4. Stripe marks the order paid through the webhook (`checkout.session.completed`). The success
   page also verifies the session server-side, so a missed webhook does not strand an order.

Provider settings live in the `settings` table under the `payments` key and are edited at
`/admin/settings → Payments`. Secret keys are never sent to the storefront:
`publicPayments()` in `src/lib/settings.ts` strips them before the checkout page renders.

## Provider contract

A provider needs:

| Step | Where |
| --- | --- |
| Appear as an option at checkout | `publicPayments()` in `src/lib/settings.ts` |
| Be accepted by the API | the `requireOneOf([...])` list in `src/app/api/checkout/route.ts` |
| Create a payment | a branch after `createOrder` in the same route |
| Confirm payment | a webhook route under `src/app/api/payments/<provider>/webhook/route.ts` calling `markPaid(order.id, reference)` |
| Show instructions | `components/store/checkout-form.tsx` (from the provider's `instructions`) |

### Adding a provider in ~40 lines (example: manual "cash on pickup")

1. Add the provider to `PaymentSettings` and `DEFAULT_SETTINGS.payments` in
   `src/lib/settings.ts` with `enabled`, `label` and `instructions`.
2. Add it to the `publicPayments()` provider list.
3. Add its id to the `requireOneOf` list in `src/app/api/checkout/route.ts`. No extra branch is
   needed if it behaves like cash on delivery (order stays `unpaid` until an admin confirms).
4. Add a card to the admin settings form (`components/admin/settings-form.tsx`) so the label
   and instructions are editable.

Providers that need a redirect (like Stripe) return `{ redirectUrl }` from the checkout route;
providers that settle offline return the success path with their instructions.

## Refunds

Refunds are recorded, not processed: set the order's payment status to `refunded` in the admin
panel. Issue the actual refund in your provider dashboard (Stripe, your bank, or in person).
Adding `stripe.refunds.create` would be a welcome contribution.

## Currency and tax

- Currency is a store setting (`USD`, `EUR`, `GBP`, `INR`, …); all amounts are integer cents.
- Tax is a flat percentage (`taxRateBp`) applied to the subtotal. Per-region tax rules are out
  of scope for the starter; the recompute step in `POST /api/checkout` is the place to add them.
