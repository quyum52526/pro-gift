import type { PrintArea, ProductSpec } from "@/types/product";

/** Row shape of public.categories. */
export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
}

/** Image entry stored in products.images. `path` is set for files in Supabase Storage. */
export interface StoredImage {
  src: string;
  alt: string;
  path?: string;
  printArea?: PrintArea;
}

/** Row shape of public.products, with its category joined in. */
export interface ProductRow {
  id: string;
  slug: string;
  code: string;
  name: string;
  category_id: string;
  short_description: string;
  description: string;
  price_min: number;
  price_max: number;
  moq: number;
  lead_time: string | null;
  video_url: string | null;
  specs: ProductSpec[];
  branding_methods: string[];
  images: StoredImage[];
  created_at: string;
  updated_at: string;
  category: Pick<CategoryRow, "id" | "slug" | "name" | "sort_order"> | null;
}

export const PRODUCT_SELECT = "*, category:categories(id, slug, name, sort_order)";
