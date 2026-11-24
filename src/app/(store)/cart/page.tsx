import type { Metadata } from 'next';
import { CartView } from '@/components/store/cart-view';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your cart' };

export default async function CartPage() {
  const settings = getSettings();
  return (
    <div className="shell py-12 lg:py-16">
      <p className="eyebrow">Your cart</p>
      <h1 className="mt-4 text-[clamp(2rem,3.6vw,3rem)] leading-none tracking-[-0.035em]">Review your order</h1>
      <CartView
        currency={settings.currency}
        flatShippingCents={settings.flatShippingCents}
        freeShippingThresholdCents={settings.freeShippingThresholdCents}
      />
    </div>
  );
}
