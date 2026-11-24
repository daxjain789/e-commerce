'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { KeyRound, Loader2, Plus, Save, X } from 'lucide-react';
import type { NavLink, Settings } from '@/lib/settings';
import { adminButtonPrimary, adminButtonSecondary, cn } from '@/lib/ui';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'AED', 'SGD'];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-hairline bg-white shadow-card">
      <header className="border-b border-hairline px-5 py-4">
        <h2 className="text-[14px] font-medium text-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-[12.5px] text-graphite">{description}</p> : null}
      </header>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

function Text({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = 'text',
  className,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="admin-label">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="admin-input mt-1.5"
      />
      {hint ? <span className="mt-1 block text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="admin-label">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} className="admin-input mt-1.5 resize-y" />
    </label>
  );
}

function LinkEditor({
  label,
  links,
  onChange,
}: {
  label: string;
  links: NavLink[];
  onChange: (next: NavLink[]) => void;
}) {
  return (
    <div>
      <p className="admin-label">{label}</p>
      <div className="mt-2 space-y-2">
        {links.map((link, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input
              value={link.label}
              onChange={(event) => {
                const next = links.map((item, i) => (i === index ? { ...item, label: event.target.value } : item));
                onChange(next);
              }}
              className="admin-input"
              placeholder="Label"
              aria-label={`${label} ${index + 1} label`}
            />
            <input
              value={link.href}
              onChange={(event) => {
                const next = links.map((item, i) => (i === index ? { ...item, href: event.target.value } : item));
                onChange(next);
              }}
              className="admin-input"
              placeholder="/about"
              aria-label={`${label} ${index + 1} link`}
            />
            <button
              type="button"
              onClick={() => onChange(links.filter((_, i) => i !== index))}
              className="rounded-md border border-hairline px-2 text-muted transition hover:border-red-300 hover:text-red-700"
              aria-label={`Remove ${label} ${index + 1}`}
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...links, { label: '', href: '' }])}
        className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-graphite transition hover:text-ink"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        Add link
      </button>
    </div>
  );
}

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const logoInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    ...initial,
    flatShipping: (initial.flatShippingCents / 100).toFixed(2).replace(/\.00$/, ''),
    freeShipping: (initial.freeShippingThresholdCents / 100).toFixed(2).replace(/\.00$/, ''),
    taxRate: (initial.taxRateBp / 100).toFixed(2).replace(/\.00$/, ''),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const setPayment = (provider: 'cod' | 'bank' | 'stripe', patch: Record<string, unknown>) =>
    setForm((current) => ({
      ...current,
      payments: { ...current.payments, [provider]: { ...current.payments[provider], ...patch } },
    }));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    const payload = {
      siteName: form.siteName,
      tagline: form.tagline,
      description: form.description,
      accentColor: form.accentColor,
      announcement: form.announcement,
      logoUrl: form.logoUrl,
      currency: form.currency,
      locale: form.locale,
      supportEmail: form.supportEmail,
      phone: form.phone,
      address: form.address,
      flatShippingCents: Math.round(Number(form.flatShipping) * 100) || 0,
      freeShippingThresholdCents: Math.round(Number(form.freeShipping) * 100) || 0,
      taxRateBp: Math.round(Number(form.taxRate) * 100) || 0,
      nav: form.nav.filter((link) => link.label.trim() && link.href.trim()),
      footerLinks: form.footerLinks.filter((link) => link.label.trim() && link.href.trim()),
      footerNote: form.footerNote,
      payments: form.payments,
    };

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error || 'Could not save settings.');
      } else {
        setNotice('Settings saved. The storefront has been updated.');
        router.refresh();
      }
    } catch {
      setError('Network error while saving.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr] xl:items-start">
      <div className="space-y-5">
        <Section title="Brand" description="The name, voice and accent colour used across the storefront.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Text label="Store name" value={form.siteName} onChange={(value) => set('siteName', value)} />
            <Text label="Tagline" value={form.tagline} onChange={(value) => set('tagline', value)} />
          </div>
          <TextArea label="Short description" value={form.description} onChange={(value) => set('description', value)} rows={3} />
          <Text
            label="Announcement bar"
            value={form.announcement}
            onChange={(value) => set('announcement', value)}
            hint="Leave empty to hide the bar above the header."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="admin-label">Accent colour</span>
              <span className="mt-1.5 flex items-center gap-2">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(event) => set('accentColor', event.target.value)}
                  className="h-9 w-10 cursor-pointer rounded border border-hairline bg-white p-0.5"
                  aria-label="Accent colour"
                />
                <input
                  value={form.accentColor}
                  onChange={(event) => set('accentColor', event.target.value)}
                  className="admin-input"
                  placeholder="#b4552d"
                />
              </span>
            </label>
            <label className="block">
              <span className="admin-label">Currency</span>
              <select value={form.currency} onChange={(event) => set('currency', event.target.value)} className="admin-input mt-1.5">
                {CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>
            <Text label="Locale" value={form.locale} onChange={(value) => set('locale', value)} hint="Used for price formatting." />
          </div>

          <div>
            <p className="admin-label">Logo</p>
            <div className="mt-1.5 flex items-center gap-3">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="" className="h-10 w-auto rounded border border-hairline bg-white p-1" />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded border border-dashed border-hairline text-[10px] text-muted">
                  None
                </div>
              )}
              <input
                value={form.logoUrl}
                onChange={(event) => set('logoUrl', event.target.value)}
                className="admin-input"
                placeholder="/demo/logo.svg or https://…"
              />
              <button
                type="button"
                onClick={() => logoInput.current?.click()}
                disabled={uploading}
                className={adminButtonSecondary}
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} /> : null}
                Upload
              </button>
              <input
                ref={logoInput}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  const body = new FormData();
                  body.append('file', file);
                  const response = await fetch('/api/uploads', { method: 'POST', body });
                  const payload = await response.json().catch(() => ({}));
                  if (response.ok) set('logoUrl', payload.data.url);
                  setUploading(false);
                  if (logoInput.current) logoInput.current.value = '';
                }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted">Leave empty to use the built-in monogram mark.</p>
          </div>
        </Section>

        <Section title="Contact" description="Shown in the footer, the contact page and order emails.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Text label="Support email" value={form.supportEmail} onChange={(value) => set('supportEmail', value)} type="email" />
            <Text label="Phone" value={form.phone} onChange={(value) => set('phone', value)} />
          </div>
          <Text label="Studio address" value={form.address} onChange={(value) => set('address', value)} />
        </Section>

        <Section title="Shipping & tax" description="Applied at checkout by the API — the same number everywhere.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Text
              label="Flat shipping"
              value={form.flatShipping}
              onChange={(value) => set('flatShipping', value)}
              hint="In store currency."
            />
            <Text
              label="Free shipping over"
              value={form.freeShipping}
              onChange={(value) => set('freeShipping', value)}
              hint="0 disables free shipping."
            />
            <Text label="Tax rate" value={form.taxRate} onChange={(value) => set('taxRate', value)} hint="Percent, 0 to disable." />
          </div>
        </Section>

        <Section title="Navigation" description="Header links, footer links and the footer note.">
          <LinkEditor label="Header links" links={form.nav} onChange={(links) => set('nav', links)} />
          <LinkEditor label="Footer links" links={form.footerLinks} onChange={(links) => set('footerLinks', links)} />
          <TextArea label="Footer note" value={form.footerNote} onChange={(value) => set('footerNote', value)} rows={2} />
        </Section>

        <Section title="Payments" description="Enable what you support. Stripe keys are stored server-side and never sent to the storefront.">
          {(['cod', 'bank', 'stripe'] as const).map((provider) => {
            const value = form.payments[provider];
            const titles = {
              cod: 'Cash on delivery',
              bank: 'Bank transfer',
              stripe: 'Stripe (cards)',
            };
            return (
              <div key={provider} className="rounded-md border border-hairline p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-medium text-ink">{titles[provider]}</p>
                  <label className="flex cursor-pointer items-center gap-2 text-[12px] text-graphite">
                    <input
                      type="checkbox"
                      checked={Boolean(value.enabled)}
                      onChange={(event) => setPayment(provider, { enabled: event.target.checked })}
                      className="h-4 w-4 accent-accent"
                    />
                    Enabled
                  </label>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Text
                    label="Label at checkout"
                    value={value.label}
                    onChange={(next) => setPayment(provider, { label: next })}
                  />
                  {provider === 'stripe' ? (
                    <Text
                      label="Secret key"
                      type="password"
                      value={value.secretKey ?? ''}
                      onChange={(next) => setPayment(provider, { secretKey: next })}
                      hint="sk_test_… or sk_live_…"
                    />
                  ) : null}
                </div>
                <div className="mt-3">
                  <TextArea
                    label="Instructions shown to the customer"
                    value={value.instructions}
                    onChange={(next) => setPayment(provider, { instructions: next })}
                    rows={2}
                  />
                </div>
                {provider === 'bank' ? (
                  <div className="mt-3">
                    <TextArea
                      label="Bank details"
                      value={value.details ?? ''}
                      onChange={(next) => setPayment(provider, { details: next })}
                      rows={3}
                    />
                  </div>
                ) : null}
                {provider === 'stripe' ? (
                  <div className="mt-3">
                    <Text
                      label="Webhook signing secret"
                      type="password"
                      value={value.webhookSecret ?? ''}
                      onChange={(next) => setPayment(provider, { webhookSecret: next })}
                      hint="whsec_… Add https://your-domain/api/payments/stripe/webhook in Stripe."
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </Section>
      </div>

      <div className="space-y-5 xl:sticky xl:top-6">
        {error ? (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-800">
            {notice}
          </p>
        ) : null}

        <button type="submit" disabled={saving} className={cn(adminButtonPrimary, 'w-full')}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Save className="h-4 w-4" strokeWidth={1.8} />}
          {saving ? 'Saving…' : 'Save settings'}
        </button>

        <PasswordForm />
      </div>
    </form>
  );
}

function PasswordForm() {
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event?: React.FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || 'Could not change the password.');
      } else {
        setMessage('Password changed.');
        setCurrent('');
        setNext('');
      }
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-hairline bg-white p-5 shadow-card">
      <h2 className="flex items-center gap-2 text-[14px] font-medium text-ink">
        <KeyRound className="h-4 w-4" strokeWidth={1.7} />
        Admin password
      </h2>
      <p className="mt-1 text-[12px] leading-relaxed text-graphite">
        Change the password created at first boot. Use at least eight characters.
      </p>
      <div className="mt-3 space-y-3">
        <label className="block">
          <span className="admin-label">Current password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrent(event.target.value)}
            className="admin-input mt-1.5"
          />
        </label>
        <label className="block">
          <span className="admin-label">New password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNext(event.target.value)}
            className="admin-input mt-1.5"
          />
        </label>
      </div>
      {error ? <p className="mt-3 text-[12px] text-red-700">{error}</p> : null}
      {message ? <p className="mt-3 text-[12px] text-emerald-700">{message}</p> : null}
      <button type="button" onClick={() => submit()} disabled={busy} className={cn(adminButtonSecondary, 'mt-3 w-full')}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} /> : null}
        Update password
      </button>
    </section>
  );
}
