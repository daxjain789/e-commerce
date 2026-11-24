import type { Block, BlockType } from './types';

export type FieldType = 'text' | 'textarea' | 'image' | 'select' | 'number';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  help?: string;
  options?: { value: string; label: string }[];
  rows?: number;
}

export interface BlockDef {
  type: BlockType;
  label: string;
  description: string;
  fields: FieldDef[];
  items?: {
    key: string;
    label: string;
    labelKey: string;
    fields: FieldDef[];
    defaultItem: Record<string, string>;
  };
}

const ALIGN: FieldDef = {
  key: 'align',
  label: 'Alignment',
  type: 'select',
  options: [
    { value: 'left', label: 'Split — text left, image right' },
    { value: 'center', label: 'Centred — text only' },
  ],
};

export const BLOCK_DEFS: BlockDef[] = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'The opening statement. Large headline, optional image and two calls to action.',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text', placeholder: 'Small-batch homeware · Portland, OR' },
      { key: 'title', label: 'Headline', type: 'textarea', rows: 2, placeholder: 'Objects that get better with use.' },
      { key: 'body', label: 'Supporting text', type: 'textarea', rows: 3 },
      { key: 'image', label: 'Image', type: 'image' },
      ALIGN,
      { key: 'ctaLabel', label: 'Primary button label', type: 'text' },
      { key: 'ctaHref', label: 'Primary button link', type: 'text', placeholder: '/products' },
      { key: 'secondaryLabel', label: 'Secondary link label', type: 'text' },
      { key: 'secondaryHref', label: 'Secondary link href', type: 'text' },
    ],
  },
  {
    type: 'productGrid',
    label: 'Product grid',
    description: 'A live grid of products. Pulls from the catalogue, so it never goes stale.',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'body', label: 'Supporting text', type: 'textarea', rows: 2 },
      {
        key: 'source',
        label: 'Which products',
        type: 'select',
        options: [
          { value: 'featured', label: 'Featured products' },
          { value: 'all', label: 'Newest products' },
          { value: 'category', label: 'A specific category' },
        ],
      },
      { key: 'categorySlug', label: 'Category slug (when using a category)', type: 'text', placeholder: 'tableware' },
      { key: 'limit', label: 'How many', type: 'number' },
      { key: 'ctaLabel', label: 'Link label', type: 'text', placeholder: 'View all products' },
      { key: 'ctaHref', label: 'Link href', type: 'text', placeholder: '/products' },
    ],
  },
  {
    type: 'imageText',
    label: 'Image + text',
    description: 'A two-column story block: photograph on one side, copy on the other.',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea', rows: 5 },
      { key: 'image', label: 'Image', type: 'image' },
      {
        key: 'imageSide',
        label: 'Image position',
        type: 'select',
        options: [
          { value: 'right', label: 'Right' },
          { value: 'left', label: 'Left' },
        ],
      },
      { key: 'ctaLabel', label: 'Link label', type: 'text' },
      { key: 'ctaHref', label: 'Link href', type: 'text' },
    ],
  },
  {
    type: 'featureList',
    label: 'Feature list',
    description: 'Three numbered promises — repairs, shipping, materials.',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
    ],
    items: {
      key: 'items',
      label: 'Features',
      labelKey: 'title',
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'body', label: 'Body', type: 'textarea', rows: 3 },
      ],
      defaultItem: { title: 'A new promise', body: 'Explain the promise in one or two sentences.' },
    },
  },
  {
    type: 'faq',
    label: 'FAQ',
    description: 'Collapsible questions and answers.',
    fields: [{ key: 'title', label: 'Title', type: 'text' }],
    items: {
      key: 'items',
      label: 'Questions',
      labelKey: 'question',
      fields: [
        { key: 'question', label: 'Question', type: 'text' },
        { key: 'answer', label: 'Answer', type: 'textarea', rows: 3 },
      ],
      defaultItem: { question: 'A new question?', answer: 'The answer, written plainly.' },
    },
  },
  {
    type: 'cta',
    label: 'Call to action',
    description: 'Dark panel with a headline, a sentence and one button.',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea', rows: 3 },
      { key: 'ctaLabel', label: 'Button label', type: 'text' },
      { key: 'ctaHref', label: 'Button link', type: 'text' },
      { key: 'image', label: 'Background image', type: 'image' },
    ],
  },
  {
    type: 'gallery',
    label: 'Gallery',
    description: 'A grid of images — studio shots, details, process.',
    fields: [{ key: 'title', label: 'Title', type: 'text' }],
    items: {
      key: 'images',
      label: 'Images',
      labelKey: 'src',
      fields: [
        { key: 'src', label: 'Image', type: 'image' },
        { key: 'alt', label: 'Alt text', type: 'text' },
      ],
      defaultItem: { src: '', alt: '' },
    },
  },
  {
    type: 'quote',
    label: 'Quote',
    description: 'One line of proof, set large.',
    fields: [
      { key: 'quote', label: 'Quote', type: 'textarea', rows: 3 },
      { key: 'author', label: 'Author', type: 'text' },
      { key: 'role', label: 'Role / context', type: 'text' },
    ],
  },
  {
    type: 'richText',
    label: 'Rich text',
    description: 'Markdown-lite body: ## headings, - lists, **bold**, [links](/path).',
    fields: [{ key: 'body', label: 'Body', type: 'textarea', rows: 12 }],
  },
];

export function blockDef(type: BlockType): BlockDef | undefined {
  return BLOCK_DEFS.find((def) => def.type === type);
}

export function newBlock(type: BlockType): Block {
  const def = blockDef(type);
  const props: Record<string, any> = {};
  def?.fields.forEach((field) => {
    if (field.type === 'select') props[field.key] = field.options?.[0]?.value ?? '';
    else props[field.key] = field.key === 'limit' ? 4 : '';
  });
  if (def?.type === 'hero') props.align = 'left';
  if (def?.type === 'imageText') props.imageSide = 'right';
  if (def?.type === 'productGrid') props.source = 'featured';
  if (def?.items) props[def.items.key] = [{ ...def.items.defaultItem }];

  return {
    id: `blk_${Math.random().toString(36).slice(2, 10)}`,
    type,
    props,
  };
}
