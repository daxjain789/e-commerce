export type BlockType =
  | 'hero'
  | 'richText'
  | 'productGrid'
  | 'imageText'
  | 'featureList'
  | 'faq'
  | 'cta'
  | 'gallery'
  | 'quote';

export interface Block {
  id: string;
  type: BlockType;
  props: Record<string, any>;
}

export type ProductStatus = 'active' | 'draft';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  compareAtCents: number | null;
  sku: string;
  stock: number;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  images: string[];
  status: ProductStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  position: number;
  productCount?: number;
}

export type PageStatus = 'published' | 'draft';

export interface Page {
  id: string;
  slug: string;
  title: string;
  blocks: Block[];
  status: PageStatus;
  seoTitle: string;
  seoDescription: string;
  updatedAt: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  slug: string;
  image: string;
  priceCents: number;
  quantity: number;
}

export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'cancelled' | 'refunded';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'refunded' | 'failed';

export interface Order {
  id: string;
  number: string;
  email: string;
  name: string;
  phone: string;
  address: Address;
  items: OrderItem[];
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  status: OrderStatus;
  paymentProvider: string;
  paymentStatus: PaymentStatus;
  paymentRef: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName?: string;
  delta: number;
  reason: string;
  orderId: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}
