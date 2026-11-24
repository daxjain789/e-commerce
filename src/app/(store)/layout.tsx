import type { ReactNode } from 'react';
import { getSettings } from '@/lib/settings';
import { CartProvider } from '@/components/store/cart-provider';
import { SiteHeader } from '@/components/store/site-header';
import { SiteFooter } from '@/components/store/site-footer';
import { CartDrawer } from '@/components/store/cart-drawer';

export const dynamic = 'force-dynamic';

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const settings = getSettings();

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader
          siteName={settings.siteName}
          nav={settings.nav}
          announcement={settings.announcement}
          logoUrl={settings.logoUrl}
        />
        <main className="flex-1">{children}</main>
        <SiteFooter
          siteName={settings.siteName}
          tagline={settings.tagline}
          footerNote={settings.footerNote}
          footerLinks={settings.footerLinks}
          supportEmail={settings.supportEmail}
          phone={settings.phone}
          address={settings.address}
          payments={settings.payments}
        />
      </div>
      <CartDrawer />
    </CartProvider>
  );
}
