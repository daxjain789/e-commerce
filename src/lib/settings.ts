import 'server-only';
import { all, run } from './db';

export interface PaymentProviderSettings {
  enabled: boolean;
  label: string;
  instructions: string;
  details?: string;
  secretKey?: string;
  webhookSecret?: string;
}

export interface PaymentSettings {
  cod: PaymentProviderSettings;
  bank: PaymentProviderSettings;
  stripe: PaymentProviderSettings;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface Settings {
  siteName: string;
  tagline: string;
  description: string;
  accentColor: string;
  announcement: string;
  logoUrl: string;
  currency: string;
  locale: string;
  supportEmail: string;
  phone: string;
  address: string;
  flatShippingCents: number;
  freeShippingThresholdCents: number;
  taxRateBp: number;
  nav: NavLink[];
  footerNote: string;
  footerLinks: NavLink[];
  payments: PaymentSettings;
}

export const DEFAULT_SETTINGS: Settings = {
  siteName: 'Meridian Supply',
  tagline: 'Objects for a considered life.',
  description:
    'A small studio shop for everyday objects — stoneware, timber, linen and brass, made in limited batches by people who care how things wear in.',
  accentColor: '#b4552d',
  announcement: 'Free shipping over $150 · Made in small batches · 30-day returns',
  logoUrl: '',
  currency: 'USD',
  locale: 'en-US',
  supportEmail: 'hello@meridiansupply.co',
  phone: '+1 (415) 555-0142',
  address: '18 Foundry Lane, Studio 4 · Portland, OR 97209',
  flatShippingCents: 1200,
  freeShippingThresholdCents: 15000,
  taxRateBp: 0,
  nav: [
    { label: 'Shop', href: '/products' },
    { label: 'Our story', href: '/about' },
    { label: 'Care guide', href: '/care-guide' },
    { label: 'FAQ', href: '/faq' },
  ],
  footerNote: 'Meridian Supply is an open-source storefront. Fork it, brand it, sell with it.',
  footerLinks: [
    { label: 'Shipping & returns', href: '/shipping-returns' },
    { label: 'Contact', href: '/contact' },
    { label: 'Admin', href: '/admin' },
  ],
  payments: {
    cod: {
      enabled: true,
      label: 'Cash on delivery',
      instructions: 'Pay the courier in cash when your order arrives. Available within the continental US.',
    },
    bank: {
      enabled: true,
      label: 'Bank transfer',
      instructions:
        'We will email the invoice and bank details. Orders ship as soon as the transfer clears (usually one business day).',
      details: 'Meridian Supply LLC · IBAN GB29 NWBK 6016 1331 9268 19 · Reference: your order number',
    },
    stripe: {
      enabled: false,
      label: 'Card payment',
      instructions: 'Secure checkout powered by Stripe. Test mode uses card 4242 4242 4242 4242.',
      secretKey: '',
      webhookSecret: '',
    },
  },
};

type SettingsKey = keyof Settings;

function coerce<K extends SettingsKey>(key: K, value: unknown): Settings[K] {
  const fallback = DEFAULT_SETTINGS[key];
  if (typeof fallback === 'number') {
    const n = Number(value);
    return (Number.isFinite(n) ? n : fallback) as Settings[K];
  }
  if (Array.isArray(fallback)) {
    return (Array.isArray(value) ? value : fallback) as Settings[K];
  }
  if (typeof fallback === 'object' && fallback !== null) {
    return { ...(fallback as object), ...(typeof value === 'object' && value ? value : {}) } as Settings[K];
  }
  return (value === undefined || value === null ? fallback : String(value)) as Settings[K];
}

export function getSettings(): Settings {
  const rows = all<{ key: string; value: string }>('SELECT key, value FROM settings');
  const stored = new Map(rows.map((r) => [r.key, r.value]));
  const result = { ...DEFAULT_SETTINGS } as Settings;

  (Object.keys(DEFAULT_SETTINGS) as SettingsKey[]).forEach((key) => {
    const raw = stored.get(key);
    if (raw === undefined) return;
    try {
      (result as any)[key] = coerce(key, JSON.parse(raw));
    } catch {
      /* keep default for malformed values */
    }
  });

  result.payments = {
    cod: { ...DEFAULT_SETTINGS.payments.cod, ...(result.payments?.cod ?? {}) },
    bank: { ...DEFAULT_SETTINGS.payments.bank, ...(result.payments?.bank ?? {}) },
    stripe: { ...DEFAULT_SETTINGS.payments.stripe, ...(result.payments?.stripe ?? {}) },
  };
  return result;
}

export function saveSettings(patch: Record<string, unknown>): Settings {
  Object.entries(patch).forEach(([key, value]) => {
    if (!(key in DEFAULT_SETTINGS)) return;
    run(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      key,
      JSON.stringify(value),
    );
  });
  return getSettings();
}

/** Storefront-safe settings: never leak payment secrets to the client. */
export function publicPayments(settings: Settings) {
  return {
    providers: (['cod', 'bank', 'stripe'] as const)
      .filter((id) => settings.payments[id]?.enabled)
      .map((id) => ({
        id,
        label: settings.payments[id].label,
        instructions: settings.payments[id].instructions,
        details: id === 'bank' ? settings.payments.bank.details ?? '' : '',
      })),
    stripeConfigured: Boolean(settings.payments.stripe.enabled && settings.payments.stripe.secretKey),
  };
}
