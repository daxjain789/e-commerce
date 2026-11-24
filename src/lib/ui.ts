import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const buttonPrimary =
  'inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-[13px] font-medium uppercase tracking-[0.14em] text-paper transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-50';

export const buttonSecondary =
  'inline-flex items-center justify-center gap-2 rounded-full border border-ink/25 px-6 py-3 text-[13px] font-medium uppercase tracking-[0.14em] text-ink transition hover:border-ink hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-50';

export const buttonSmall =
  'inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/20 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-ink transition hover:border-ink hover:bg-ink hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50';

export const adminButtonPrimary =
  'inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export const adminButtonSecondary =
  'inline-flex items-center justify-center gap-2 rounded-md border border-hairline bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-ink/30 hover:bg-ink/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export const adminButtonDanger =
  'inline-flex items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:border-red-400 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50';

export const input =
  'w-full rounded-md border border-hairline bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/70 focus:border-ink/40 focus:ring-2 focus:ring-accent/20 disabled:bg-ink/5 disabled:text-muted';

export const label = 'block text-[12px] font-medium uppercase tracking-[0.08em] text-graphite';

export const card = 'rounded-lg border border-hairline bg-white shadow-card';
