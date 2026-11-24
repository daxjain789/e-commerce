'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { BLOCK_DEFS, blockDef, newBlock, type FieldDef } from '@/lib/blocks';
import type { Block, BlockType } from '@/lib/types';
import { DeleteButton } from './delete-button';
import { adminButtonPrimary, adminButtonSecondary, cn } from '@/lib/ui';

export interface PageDraft {
  id?: string;
  title: string;
  slug: string;
  status: string;
  seoTitle: string;
  seoDescription: string;
  blocks: Block[];
}

async function uploadFile(file: File): Promise<string | null> {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch('/api/uploads', { method: 'POST', body });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => ({}));
  return payload?.data?.url ?? null;
}

function Field({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (next: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <label className={cn('block', field.type === 'textarea' && 'sm:col-span-2')}>
      <span className="admin-label">{field.label}</span>

      {field.type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={field.rows ?? 3}
          placeholder={field.placeholder}
          className="admin-input mt-1.5 resize-y leading-relaxed"
        />
      ) : field.type === 'select' ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} className="admin-input mt-1.5">
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === 'image' ? (
        <span className="mt-1.5 flex items-start gap-2">
          {value ? (
            <span className="relative block h-16 w-14 shrink-0 overflow-hidden rounded-sm border border-hairline bg-parchment">
              <img src={value} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute right-0 top-0 bg-ink/70 p-0.5 text-paper"
                aria-label="Clear image"
              >
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
            </span>
          ) : null}
          <span className="min-w-0 flex-1">
            <input
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="/demo/mug.svg or https://…"
              className="admin-input"
            />
            <span className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded border border-hairline px-2 py-1 text-[11px] text-graphite transition hover:border-ink/30 hover:text-ink"
              >
                {uploading ? (
                  <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                ) : (
                  <ImagePlus className="h-3 w-3" strokeWidth={1.8} />
                )}
                Upload
              </button>
              <span className="text-[10.5px] text-muted">PNG, JPG, WEBP · max 6MB</span>
            </span>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setUploading(true);
                const url = await uploadFile(file);
                setUploading(false);
                if (url) onChange(url);
                if (fileInput.current) fileInput.current.value = '';
              }}
            />
          </span>
        </span>
      ) : field.type === 'number' ? (
        <input
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          className="admin-input mt-1.5"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          className="admin-input mt-1.5"
        />
      )}

      {field.help ? <span className="mt-1 block text-[11px] text-muted">{field.help}</span> : null}
    </label>
  );
}

export function PageEditor({ page }: { page: PageDraft }) {
  const router = useRouter();
  const [draft, setDraft] = useState<PageDraft>(page);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const setMeta = (patch: Partial<PageDraft>) => setDraft((current) => ({ ...current, ...patch }));

  const updateProps = (blockId: string, patch: Record<string, unknown>) =>
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === blockId ? { ...block, props: { ...block.props, ...patch } } : block,
      ),
    }));

  const move = (index: number, direction: -1 | 1) =>
    setDraft((current) => {
      const next = [...current.blocks];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, blocks: next };
    });

  async function save() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(page.id ? `/api/pages/${page.id}` : '/api/pages', {
        method: page.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          slug: draft.slug,
          status: draft.status,
          seoTitle: draft.seoTitle,
          seoDescription: draft.seoDescription,
          blocks: draft.blocks,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || 'Could not save the page.');
      } else {
        setNotice('Published. The storefront now shows these changes.');
        if (!page.id) {
          router.push(`/admin/pages/${payload.data.id}`);
        }
        router.refresh();
      }
    } catch {
      setError('Network error while saving.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.6fr_0.85fr]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-white px-4 py-3 shadow-card">
          <p className="text-[12.5px] text-graphite">
            {draft.blocks.length} {draft.blocks.length === 1 ? 'block' : 'blocks'}
          </p>
          <button
            type="button"
            onClick={() => setPickerOpen((open) => !open)}
            className={cn(adminButtonSecondary, 'text-[12.5px]')}
            aria-expanded={pickerOpen}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            Add block
          </button>
        </div>

        {pickerOpen ? (
          <div className="grid gap-2 rounded-lg border border-hairline bg-white p-3 shadow-card sm:grid-cols-2 lg:grid-cols-3">
            {BLOCK_DEFS.map((def) => (
              <button
                key={def.type}
                type="button"
                onClick={() => {
                  setDraft((current) => ({ ...current, blocks: [...current.blocks, newBlock(def.type as BlockType)] }));
                  setPickerOpen(false);
                }}
                className="rounded-md border border-hairline px-3 py-2.5 text-left transition hover:border-ink/30 hover:bg-ink/[0.02]"
              >
                <span className="block text-[12.5px] font-medium text-ink">{def.label}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-muted">{def.description}</span>
              </button>
            ))}
          </div>
        ) : null}

        {draft.blocks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-hairline bg-white px-6 py-16 text-center">
            <p className="font-display text-xl text-ink">This page is empty.</p>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-graphite">
              Add a hero to open with a headline, then a product grid to show what you sell.
            </p>
          </div>
        ) : null}

        {draft.blocks.map((block, index) => {
          const def = blockDef(block.type);
          const items = def?.items;
          const itemValues: Record<string, string>[] = items
            ? (Array.isArray(block.props[items.key]) ? block.props[items.key] : [])
            : [];

          return (
            <section key={block.id} className="overflow-hidden rounded-lg border border-hairline bg-white shadow-card">
              <header className="flex items-center justify-between gap-3 border-b border-hairline bg-ink/[0.02] px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-ink text-[10px] font-medium text-paper">
                    {index + 1}
                  </span>
                  <p className="truncate text-[13px] font-medium text-ink">{def?.label ?? block.type}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="rounded p-1.5 text-graphite transition hover:bg-ink/5 hover:text-ink disabled:opacity-25"
                    aria-label={`Move ${def?.label ?? 'block'} up`}
                  >
                    <ChevronUp className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === draft.blocks.length - 1}
                    className="rounded p-1.5 text-graphite transition hover:bg-ink/5 hover:text-ink disabled:opacity-25"
                    aria-label={`Move ${def?.label ?? 'block'} down`}
                  >
                    <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({ ...current, blocks: current.blocks.filter((item) => item.id !== block.id) }))
                    }
                    className="rounded p-1.5 text-graphite transition hover:bg-red-50 hover:text-red-700"
                    aria-label={`Remove ${def?.label ?? 'block'}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </button>
                </div>
              </header>

              <div className="grid gap-3 p-4 sm:grid-cols-2">
                {def?.fields.map((field) => (
                  <Field
                    key={field.key}
                    field={field}
                    value={String(block.props[field.key] ?? '')}
                    onChange={(next) => updateProps(block.id, { [field.key]: next })}
                  />
                ))}
              </div>

              {items ? (
                <div className="border-t border-hairline bg-ink/[0.015] p-4">
                  <p className="admin-label">{items.label}</p>
                  <div className="mt-2 space-y-3">
                    {itemValues.map((item, itemIndex) => (
                      <div key={itemIndex} className="rounded-md border border-hairline bg-white p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] uppercase tracking-[0.1em] text-muted">Item {itemIndex + 1}</p>
                          <button
                            type="button"
                            onClick={() => {
                              const next = itemValues.filter((_, i) => i !== itemIndex);
                              updateProps(block.id, { [items.key]: next });
                            }}
                            className="text-muted transition hover:text-red-700"
                            aria-label={`Remove item ${itemIndex + 1}`}
                          >
                            <X className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
                        </div>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2">
                          {items.fields.map((field) => (
                            <Field
                              key={field.key}
                              field={field}
                              value={String(item?.[field.key] ?? '')}
                              onChange={(next) => {
                                const copy = itemValues.map((entry) => ({ ...entry }));
                                copy[itemIndex] = { ...copy[itemIndex], [field.key]: next };
                                updateProps(block.id, { [items.key]: copy });
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => updateProps(block.id, { [items.key]: [...itemValues, { ...items.defaultItem }] })}
                    className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-graphite transition hover:text-ink"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                    Add {items.label.toLowerCase().replace(/s$/, '')}
                  </button>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <section className="rounded-lg border border-hairline bg-white p-4 shadow-card">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-graphite">Page settings</h2>
          <div className="mt-3 space-y-3">
            <label className="block">
              <span className="admin-label">Title</span>
              <input
                value={draft.title}
                onChange={(event) => setMeta({ title: event.target.value })}
                className="admin-input mt-1.5"
                placeholder="Our story"
              />
            </label>
            <label className="block">
              <span className="admin-label">Slug</span>
              <input
                value={draft.slug}
                onChange={(event) => setMeta({ slug: event.target.value })}
                className="admin-input mt-1.5"
                placeholder="our-story"
              />
              <span className="mt-1 block text-[11px] text-muted">
                URL: {draft.slug === 'home' ? '/' : `/${draft.slug || '…'}`}
                {draft.slug === 'home' ? ' — the homepage' : ''}
              </span>
            </label>
            <label className="block">
              <span className="admin-label">Status</span>
              <select
                value={draft.status}
                onChange={(event) => setMeta({ status: event.target.value })}
                className="admin-input mt-1.5"
              >
                <option value="published">Published</option>
                <option value="draft">Draft — hidden</option>
              </select>
            </label>
            <label className="block">
              <span className="admin-label">SEO title</span>
              <input
                value={draft.seoTitle}
                onChange={(event) => setMeta({ seoTitle: event.target.value })}
                className="admin-input mt-1.5"
                placeholder="Defaults to the page title"
              />
            </label>
            <label className="block">
              <span className="admin-label">SEO description</span>
              <textarea
                value={draft.seoDescription}
                onChange={(event) => setMeta({ seoDescription: event.target.value })}
                rows={3}
                className="admin-input mt-1.5 resize-y"
                placeholder="One or two sentences for search results."
              />
            </label>
          </div>
        </section>

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

        <button type="button" onClick={save} disabled={saving} className={cn(adminButtonPrimary, 'w-full')}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Save className="h-4 w-4" strokeWidth={1.8} />}
          {saving ? 'Saving…' : page.id ? 'Save page' : 'Create page'}
        </button>

        <div className="flex items-center justify-between gap-2">
          <Link href="/admin/pages" className="text-[12px] uppercase tracking-[0.1em] text-graphite hover:text-ink">
            ← All pages
          </Link>
          {page.id ? (
            <Link
              href={draft.slug === 'home' ? '/' : `/${draft.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.1em] text-graphite hover:text-ink"
            >
              Preview
              <ExternalLink className="h-3 w-3" strokeWidth={1.8} />
            </Link>
          ) : null}
        </div>

        {page.id ? (
          <div className="flex justify-end border-t border-hairline pt-4">
            <DeleteButton endpoint={`/api/pages/${page.id}`} label="Delete page" redirectTo="/admin/pages" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
