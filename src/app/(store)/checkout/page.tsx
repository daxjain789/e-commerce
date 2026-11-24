import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/store/checkout-form';
import { getSettings, publicPayments } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Checkout' };

export default async function CheckoutPage() {
  const settings = getSettings();
  const payments = publicPayments(settings);

  return (
    <div className="shell py-12 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Checkout</p>
          <h1 className="mt-4 text-[clamp(2rem,3.6vw,3rem)] leading-none tracking-[-0.035em]">Where should it go?</h1>
        </div>
        <p className="text-[12px] uppercase tracking-[0.12em] text-muted">Secure · No account needed</p>
      </div>

      <CheckoutForm
        providers={payments.providers}
        currency={settings.currency}
        flatShippingCents={settings.flatShippingCents}
        freeShippingThresholdCents={settings.freeShippingThresholdCents}
        taxRateBp={settings.taxRateBp}
        supportEmail={settings.supportEmail}
      />
    </div>
  );
}
