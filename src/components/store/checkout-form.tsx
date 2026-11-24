'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Loader2, Lock } from 'lucide-react';
import { useCart } from './cart-provider';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/ui';

interface Provider {
  id: string;
  label: string;
  instructions: string;
  details: string;
}

interface Fields {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  notes: string;
}

const initialFields: Fields = {
  name: '',
  email: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  region: '',
  postalCode: '',
  country: 'United States',
  notes: '',
};

export function CheckoutForm({
  providers,
  currency,
  flatShippingCents,
  freeShippingThresholdCents,
  taxRateBp,
  supportEmail,
}: {
  providers: Provider[];
  currency: string;
  flatShippingCents: number;
  freeShippingThresholdCents: number;
  taxRateBp: number;
  supportEmail: string;
}) {
  const router = useRouter();
  const { lines, ready, subtotalCents, clear } = useCart();
  const [fields, setFields] = useState<Fields>(initialFields);
  const [provider, setProvider] = useState(providers[0]?.id ?? 'cod');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shippingCents =
    freeShippingThresholdCents > 0 && subtotalCents >= freeShippingThresholdCents ? 0 : subtotalCents > 0 ? flatShippingCents : 0;
  const taxCents = Math.round((subtotalCents * taxRateBp) / 10000);
  const totalCents = subtotalCents + shippingCents + taxCents;
  const selected = providers.find((item) => item.id === provider);

  const set = (key: keyof Fields) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((current) => ({ ...current, [key]: event.target.value }));

  if (ready && lines.length === 0) {
    return (
      <div className="mt-12 rounded-sm border border-dashed border-hairline px-6 py-20 text-center">
        <p className="font-display text-2xl">There is nothing to check out.</p>
        <p className="mx-auto mt-3 max-w-sm text-[14px] text-graphite">
          Add something to your cart and we will hold it for you.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex rounded-full bg-ink px-7 py-3 text-[12px] uppercase tracking-[0.14em] text-paper transition hover:bg-accent"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
          name: fields.name,
          email: fields.email,
          phone: fields.phone,
          notes: fields.notes,
          paymentProvider: provider,
          address: {
            line1: fields.line1,
            line2: fields.line2,
            city: fields.city,
            region: fields.region,
            postalCode: fields.postalCode,
            country: fields.country,
          },
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || 'We could not place that order. Please try again.');
        setSubmitting(false);
        return;
      }

      clear();
      const redirectUrl: string = payload.data?.redirectUrl ?? '/';
      if (redirectUrl.startsWith('http')) {
        window.location.href = redirectUrl;
      } else {
        router.push(redirectUrl);
      }
    } catch {
      setError('Network error — the order was not placed. Check your connection and try again.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-10 grid gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16">
      <div className="space-y-10">
        <fieldset>
          <legend className="text-[12px] uppercase tracking-[0.16em] text-graphite">01 · Contact</legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.12em] text-muted">Full name</span>
              <input required autoComplete="name" name="name" value={fields.name} onChange={set('name')} className="field mt-1" placeholder="Ada Lovelace" />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.12em] text-muted">Email</span>
              <input required type="email" autoComplete="email" name="email" value={fields.email} onChange={set('email')} className="field mt-1" placeholder="you@example.com" />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-[11px] uppercase tracking-[0.12em] text-muted">Phone (optional)</span>
              <input autoComplete="tel" name="phone" value={fields.phone} onChange={set('phone')} className="field mt-1" placeholder="For delivery updates only" />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-[12px] uppercase tracking-[0.16em] text-graphite">02 · Shipping address</legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-[11px] uppercase tracking-[0.12em] text-muted">Address line 1</span>
              <input required autoComplete="address-line1" name="line1" value={fields.line1} onChange={set('line1')} className="field mt-1" placeholder="18 Foundry Lane" />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-[11px] uppercase tracking-[0.12em] text-muted">Address line 2 (optional)</span>
              <input autoComplete="address-line2" name="line2" value={fields.line2} onChange={set('line2')} className="field mt-1" placeholder="Apartment, studio, floor" />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.12em] text-muted">City</span>
              <input required autoComplete="address-level2" name="city" value={fields.city} onChange={set('city')} className="field mt-1" placeholder="Portland" />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.12em] text-muted">State / region</span>
              <input autoComplete="address-level1" name="region" value={fields.region} onChange={set('region')} className="field mt-1" placeholder="OR" />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.12em] text-muted">Postal code</span>
              <input required autoComplete="postal-code" name="postalCode" value={fields.postalCode} onChange={set('postalCode')} className="field mt-1" placeholder="97209" />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.12em] text-muted">Country</span>
              <input required autoComplete="country-name" name="country" value={fields.country} onChange={set('country')} className="field mt-1" />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-[12px] uppercase tracking-[0.16em] text-graphite">03 · Payment</legend>
          <div className="mt-5 space-y-3">
            {providers.map((option) => (
              <label
                key={option.id}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-sm border px-4 py-4 transition',
                  provider === option.id ? 'border-ink bg-white/70' : 'border-hairline hover:border-ink/30',
                )}
              >
                <input
                  type="radio"
                  name="paymentProvider"
                  value={option.id}
                  checked={provider === option.id}
                  onChange={() => setProvider(option.id)}
                  className="mt-1 h-4 w-4 accent-accent"
                />
                <span className="min-w-0">
                  <span className="block text-[14px] text-ink">{option.label}</span>
                  <span className="mt-1 block text-[12.5px] leading-relaxed text-graphite">{option.instructions}</span>
                  {provider === option.id && option.details ? (
                    <span className="mt-2 block whitespace-pre-line rounded-sm bg-parchment/70 px-3 py-2 text-[12px] leading-relaxed text-graphite">
                      {option.details}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
            {providers.length === 0 ? (
              <p className="rounded-sm border border-dashed border-hairline px-4 py-6 text-[13px] text-graphite">
                No payment methods are enabled. Enable one in the admin panel under Settings → Payments.
              </p>
            ) : null}
          </div>

          <label className="mt-6 block">
            <span className="text-[11px] uppercase tracking-[0.12em] text-muted">Order notes (optional)</span>
            <textarea
              name="notes"
              value={fields.notes}
              onChange={set('notes')}
              rows={3}
              className="field-boxed mt-1 resize-y"
              placeholder="Delivery instructions, gift note, anything we should know."
            />
          </label>
        </fieldset>

        {error ? (
          <p role="alert" className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-relaxed text-red-800">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-5">
          <button
            type="submit"
            disabled={submitting || providers.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-8 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-paper transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Lock className="h-3.5 w-3.5" strokeWidth={1.8} />}
            {submitting ? 'Placing order…' : `Place order · ${formatMoney(totalCents, currency)}`}
          </button>
          <Link href="/cart" className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-graphite transition hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.6} />
            Back to cart
          </Link>
        </div>
        <p className="text-[12px] leading-relaxed text-muted">
          By placing this order you agree to our{' '}
          <Link href="/shipping-returns" className="underline underline-offset-4 hover:text-ink">
            shipping & returns policy
          </Link>
          . Questions? {supportEmail ? <a href={`mailto:${supportEmail}`} className="underline underline-offset-4 hover:text-ink">{supportEmail}</a> : 'Contact the studio.'}
        </p>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-sm border border-hairline bg-white/60 p-6">
          <h2 className="text-[12px] uppercase tracking-[0.16em] text-graphite">Order summary</h2>
          <ul className="mt-5 space-y-4">
            {lines.map((line) => (
              <li key={line.productId} className="flex gap-3">
                {line.image ? (
                  <img src={line.image} alt="" className="h-16 w-12 rounded-sm bg-parchment object-cover" />
                ) : (
                  <div className="h-16 w-12 rounded-sm bg-parchment" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] text-ink">{line.name}</p>
                  <p className="mt-0.5 text-[12px] text-muted">Qty {line.quantity}</p>
                </div>
                <p className="shrink-0 text-[13px] tabular-nums">{formatMoney(line.priceCents * line.quantity, currency)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-3 border-t border-hairline pt-5 text-[13.5px]">
            <div className="flex justify-between">
              <dt className="text-graphite">Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(subtotalCents, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-graphite">Shipping</dt>
              <dd className="tabular-nums">{shippingCents === 0 ? 'Free' : formatMoney(shippingCents, currency)}</dd>
            </div>
            {taxCents > 0 ? (
              <div className="flex justify-between">
                <dt className="text-graphite">Tax</dt>
                <dd className="tabular-nums">{formatMoney(taxCents, currency)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-hairline pt-3 text-[15px]">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatMoney(totalCents, currency)}</dd>
            </div>
          </dl>
          {selected ? <p className="mt-4 text-[12px] leading-relaxed text-muted">Paying with {selected.label.toLowerCase()}.</p> : null}
        </div>
      </aside>
    </form>
  );
}
