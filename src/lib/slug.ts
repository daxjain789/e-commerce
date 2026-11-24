export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function uniqueSlug(base: string, exists: (slug: string) => boolean): string {
  const root = slugify(base) || 'item';
  if (!exists(root)) return root;
  let n = 2;
  while (exists(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}
