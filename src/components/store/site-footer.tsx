import Link from 'next/link';
import type { PaymentSettings } from '@/lib/settings';

interface NavLink {
  label: string;
  href: string;
}

export function SiteFooter({
  siteName,
  tagline,
  footerNote,
  footerLinks,
  supportEmail,
  phone,
  address,
  payments,
}: {
  siteName: string;
  tagline: string;
  footerNote: string;
  footerLinks: NavLink[];
  supportEmail: string;
  phone: string;
  address: string;
  payments: PaymentSettings;
}) {
  const year = new Date().getFullYear();
  const methods = [
    payments.cod?.enabled ? 'Cash on delivery' : null,
    payments.bank?.enabled ? 'Bank transfer' : null,
    payments.stripe?.enabled ? 'Card / Stripe' : null,
  ].filter(Boolean) as string[];

  return (
    <footer className="mt-24 border-t border-hairline bg-parchment/60">
      <div className="shell grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-2xl tracking-[-0.02em]">{siteName}</p>
          <p className="mt-3 max-w-sm text-[14.5px] leading-relaxed text-graphite">{tagline}</p>
          <p className="mt-6 max-w-sm text-[12.5px] leading-relaxed text-muted">{footerNote}</p>
        </div>

        <div>
          <p className="eyebrow">Shop</p>
          <ul className="mt-4 space-y-2.5 text-[14px] text-graphite">
            {footerLinks.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <Link href={link.href} className="link-underline hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow">Studio</p>
          <ul className="mt-4 space-y-2.5 text-[14px] text-graphite">
            {supportEmail ? (
              <li>
                <a href={`mailto:${supportEmail}`} className="link-underline break-all hover:text-ink">
                  {supportEmail}
                </a>
              </li>
            ) : null}
            {phone ? <li>{phone}</li> : null}
            {address ? <li className="text-[13px] text-muted">{address}</li> : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-hairline">
        <div className="shell flex flex-col gap-3 py-6 text-[11.5px] uppercase tracking-[0.12em] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteName}. All rights reserved.
          </p>
          <p className="normal-case tracking-normal text-muted">
            {methods.length ? `Accepted: ${methods.join(' · ')}` : 'Payment methods configured in the admin panel'}
          </p>
          <p className="normal-case tracking-normal">
            Open source —{' '}
            <a
              href="https://github.com/daxjain789/e-commerce"
              className="underline decoration-hairline underline-offset-4 hover:text-ink"
              target="_blank"
              rel="noreferrer"
            >
              MIT licensed
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
