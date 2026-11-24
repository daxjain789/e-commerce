'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Plus, Star, Trash2, Upload } from 'lucide-react';
import { DeleteButton } from './delete-button';
import { adminButtonPrimary, adminButtonSecondary, cn } from '@/lib/ui';

interface CategoryOption {
  id: string;
  name: string;
}

export interface ProductFormValues {
  id?: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  compareAtCents: number | null;
  sku: string;
  stock: number;
  categoryId: string | null;
  images: string[];
  status: 'active' | 'draft';
  featured: boolean;
}

const EMPTY: ProductFormValues = {
  name: '',
  slug: '',
  description: '',
  priceCents: 0,
  compareAtCents: null,
  sku: '',
  stock: 0,
  categoryId: null,
  images: [],
  status: 'active',
  featured: false,
};

export function ProductForm({
  product,
  categories,
}: {
  product?: ProductFormValues & { id: string };
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const initial = product ?? EMPTY;
  const [form, setForm] = useState({
    name: initial.name,
    slug: initial.slug,
    description: initial.description,
    price: initial.priceCents ? (initial.priceCents / 100).toFixed(2).replace(/\.00$/, '') : '',
    compareAt: initial.compareAtCents ? (initial.compareAtCents / 100).toFixed(2).replace(/\.00$/, '') : '',
    sku: initial.sku,
    stock: String(initial.stock),
    categoryId: initial.categoryId ?? '',
    status: initial.status,
    featured: initial.featured,
  });
  const [images, setImages] = useState<string[]>(initial.images);
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/uploads', { method: 'POST', body });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || 'Upload failed.');
        return;
      }
      setImages((current) => [...current, payload.data.url]);
    } catch {
      setError('Upload failed — check the connection and try again.');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    setSaved(false);

    const body = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      priceCents: Math.round(Number(form.price) * 100) || 0,
      compareAtCents: form.compareAt ? Math.round(Number(form.compareAt) * 100) : null,
      sku: form.sku,
      stock: Math.round(Number(form.stock)) || 0,
      categoryId: form.categoryId || null,
      images,
      status: form.status,
      featured: form.featured,
    };

    try {
      const response = await fetch(product ? `/api/products/${product.id}` : '/api/products', {
        method: product ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || 'Could not save the product.');
        setSaving(false);
        return;
      }
      setSaved(true);
      setSaving(false);
      router.refresh();
      if (!product) router.push(`/admin/products/${payload.data.id}`);
    } catch {
      setError('Network error while saving.');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="space-y-6">
        <section className="rounded-lg border border-hairline bg-white p-5 shadow-card">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-graphite">Details</h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="admin-label">Name</span>
              <input required value={form.name} onChange={set('name')} className="admin-input mt-1.5" placeholder="Ridgefield Stoneware Mug" />
            </label>
            <label className="block">
              <span className="admin-label">Slug</span>
              <input
                value={form.slug}
                onChange={set('slug')}
                className="admin-input mt-1.5"
                placeholder="auto-generated from the name"
              />
              <span className="mt-1 block text-[11.5px] text-muted">Used in the URL: /products/{form.slug || '...'}</span>
            </label>
            <label className="block">
              <span className="admin-label">Description</span>
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={9}
                className="admin-input mt-1.5 resize-y leading-relaxed"
                placeholder="Materials, dimensions, care. Blank lines separate paragraphs; ## adds a heading."
              />
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-hairline bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-graphite">Images</h2>
            <span className="text-[11.5px] text-muted">First image is the cover</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((image, index) => (
              <div key={`${image}-${index}`} className="group relative aspect-[4/5] overflow-hidden rounded-sm border border-hairline bg-parchment">
                <img src={image} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/70 p-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setImages((current) => current.filter((_, i) => i !== index))}
                    className="rounded p-1 text-paper hover:bg-paper/20"
                    aria-label="Remove image"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </button>
                  {index > 0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setImages((current) => [current[index], ...current.filter((_, i) => i !== index)])
                      }
                      className="rounded p-1 text-paper hover:bg-paper/20"
                      aria-label="Make cover image"
                    >
                      <Star className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </button>
                  ) : (
                    <span className="px-1 py-1 text-[9px] uppercase tracking-[0.1em] text-paper/80">Cover</span>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="flex aspect-[4/5] flex-col items-center justify-center gap-1.5 rounded-sm border border-dashed border-hairline text-muted transition hover:border-ink/30 hover:text-ink"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} /> : <ImagePlus className="h-4 w-4" strokeWidth={1.6} />}
              <span className="text-[10.5px] uppercase tracking-[0.08em]">{uploading ? 'Uploading' : 'Upload'}</span>
            </button>
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload(file);
            }}
          />

          <div className="mt-4 flex gap-2">
            <input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              className="admin-input"
              placeholder="…or paste an image URL, e.g. /demo/mug.svg"
            />
            <button
              type="button"
              onClick={() => {
                if (!imageUrl.trim()) return;
                setImages((current) => [...current, imageUrl.trim()]);
                setImageUrl('');
              }}
              className={adminButtonSecondary}
            >
              <Plus className="h-4 w-4" strokeWidth={1.8} />
              Add
            </button>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-lg border border-hairline bg-white p-5 shadow-card">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-graphite">Pricing</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="admin-label">Price</span>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted">$</span>
                <input
                  required
                  inputMode="decimal"
                  value={form.price}
                  onChange={set('price')}
                  className="admin-input pl-7"
                  placeholder="38.00"
                />
              </div>
            </label>
            <label className="block">
              <span className="admin-label">Compare at</span>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted">$</span>
                <input
                  inputMode="decimal"
                  value={form.compareAt}
                  onChange={set('compareAt')}
                  className="admin-input pl-7"
                  placeholder="Optional"
                />
              </div>
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-hairline bg-white p-5 shadow-card">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-graphite">Inventory</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="admin-label">Stock on hand</span>
              <input inputMode="numeric" value={form.stock} onChange={set('stock')} className="admin-input mt-1.5" />
            </label>
            <label className="block">
              <span className="admin-label">SKU</span>
              <input value={form.sku} onChange={set('sku')} className="admin-input mt-1.5" placeholder="TAB-MUG-01" />
            </label>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
            Every change here is written to the stock ledger on the Inventory page.
          </p>
        </section>

        <section className="rounded-lg border border-hairline bg-white p-5 shadow-card">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-graphite">Organisation</h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="admin-label">Category</span>
              <select value={form.categoryId} onChange={set('categoryId')} className="admin-input mt-1.5">
                <option value="">Uncategorised</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="admin-label">Status</span>
              <select value={form.status} onChange={set('status')} className="admin-input mt-1.5">
                <option value="active">Active — visible in the shop</option>
                <option value="draft">Draft — hidden</option>
              </select>
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-hairline px-3 py-2.5">
              <span>
                <span className="block text-[13px] text-ink">Feature on the homepage</span>
                <span className="block text-[11.5px] text-muted">Shown in “featured” product grids.</span>
              </span>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))}
                className="h-4 w-4 accent-accent"
              />
            </label>
          </div>
        </section>

        {error ? (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-800">
            Saved. The storefront is up to date.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className={cn(adminButtonPrimary, 'flex-1')}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Upload className="h-4 w-4" strokeWidth={1.8} />}
            {saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}
          </button>
          <Link href="/admin/products" className={adminButtonSecondary}>
            Cancel
          </Link>
        </div>

        {product ? (
          <div className="flex justify-end">
            <DeleteButton endpoint={`/api/products/${product.id}`} label="Delete product" redirectTo="/admin/products" />
          </div>
        ) : null}
      </div>
    </form>
  );
}
