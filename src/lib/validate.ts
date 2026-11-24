export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function requireString(value: unknown, label: string, opts: { max?: number; min?: number } = {}): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new ValidationError(`${label} is required.`);
  const trimmed = value.trim();
  if (opts.min && trimmed.length < opts.min) throw new ValidationError(`${label} is too short.`);
  if (opts.max && trimmed.length > opts.max) throw new ValidationError(`${label} must be under ${opts.max} characters.`);
  return trimmed;
}

export function optionalString(value: unknown, opts: { max?: number } = {}): string {
  if (value === undefined || value === null) return '';
  const str = String(value).trim();
  return opts.max ? str.slice(0, opts.max) : str;
}

export function requireEmail(value: unknown, label = 'Email'): string {
  const email = requireString(value, label, { max: 254 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) throw new ValidationError(`${label} does not look valid.`);
  return email;
}

export function requireInt(
  value: unknown,
  label: string,
  opts: { min?: number; max?: number } = {},
): number {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  if (!Number.isFinite(n) || !Number.isInteger(n)) throw new ValidationError(`${label} must be a whole number.`);
  if (opts.min !== undefined && n < opts.min) throw new ValidationError(`${label} must be at least ${opts.min}.`);
  if (opts.max !== undefined && n > opts.max) throw new ValidationError(`${label} must be at most ${opts.max}.`);
  return n;
}

export function optionalInt(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

export function requireOneOf<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  const str = String(value ?? '');
  if (!allowed.includes(str as T)) throw new ValidationError(`${label} must be one of: ${allowed.join(', ')}.`);
  return str as T;
}

export function requireArray<T = any>(value: unknown, label: string): T[] {
  if (!Array.isArray(value)) throw new ValidationError(`${label} must be a list.`);
  return value as T[];
}
