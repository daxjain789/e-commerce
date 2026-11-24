import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/ui';

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-6">
      <div className="min-w-0">
        {kicker ? <p className="eyebrow">{kicker}</p> : null}
        <h1 className="mt-2 font-display text-[26px] leading-tight tracking-[-0.02em] text-ink wrap-anywhere">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-graphite">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('rounded-lg border border-hairline bg-white shadow-card', className)}>
      {title || actions ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline px-5 py-4">
          <div>
            {title ? <h2 className="text-[14px] font-medium text-ink">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-[12.5px] text-graphite">{description}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

const BADGE_STYLES: Record<string, string> = {
  neutral: 'bg-ink/5 text-graphite',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
  accent: 'bg-accent/10 text-accent ring-1 ring-inset ring-accent/20',
  info: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof BADGE_STYLES | string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
        BADGE_STYLES[tone] ?? BADGE_STYLES.neutral,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): string {
  switch (status) {
    case 'paid':
    case 'fulfilled':
    case 'published':
    case 'active':
      return 'success';
    case 'pending':
    case 'draft':
      return 'warning';
    case 'cancelled':
    case 'refunded':
    case 'failed':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-hairline px-6 py-14 text-center">
      <p className="font-display text-xl text-ink">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-graphite">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{label}</p>
      <p className="mt-2 font-display text-[27px] leading-none tracking-[-0.02em] text-ink tabular-nums">{value}</p>
      {hint ? <p className="mt-2 text-[12px] text-graphite">{hint}</p> : null}
    </>
  );
  if (href) {
    return (
      <Link href={href} className="rounded-lg border border-hairline bg-white p-5 shadow-card transition hover:border-ink/25">
        {body}
      </Link>
    );
  }
  return <div className="rounded-lg border border-hairline bg-white p-5 shadow-card">{body}</div>;
}

export function FieldRow({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="admin-label">{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {hint ? <span className="mt-1 block text-[11.5px] text-muted">{hint}</span> : null}
    </label>
  );
}
