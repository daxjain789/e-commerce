export function formatMoney(cents: number, currency = 'USD', locale = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

/** Parse a human-typed price ("1,299.50", "$18") into integer cents. */
export function parsePriceToCents(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined || input === '') return null;
  const cleaned = String(input).replace(/[^0-9.,-]/g, '').replace(/,/g, '');
  if (cleaned === '' || cleaned === '-') return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

export function centsToInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '';
  return (cents / 100).toFixed(2);
}
