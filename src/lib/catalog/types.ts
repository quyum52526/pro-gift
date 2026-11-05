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

/** A row of public.product_categories with its category joined in. */
export interface ProductCategoryLink {
  position: number;
  category: Pick<CategoryRow, "id" | "slug" | "name" | "sort_order"> | null;
}

/** Row shape of public.products, with its categories joined in. */
export interface ProductRow {
  id: string;
  slug: string;
  code: string;
  name: string;
  /** Primary category; also present in `categories`. */
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
  available_for_gift_box: boolean;
  images: StoredImage[];
  created_at: string;
  updated_at: string;
  categories: ProductCategoryLink[];
}

/*
 * Categories are embedded through product_categories. A bare `categories(...)`
 * embed would be ambiguous: products also links to categories via category_id.
 */
export const PRODUCT_SELECT =
  "*, categories:product_categories(position, category:categories(id, slug, name, sort_order))";

/** A row's categories in display order (primary first), skipping dangling links. */
export function rowCategories(row: Pick<ProductRow, "category_id" | "categories">): CategoryRow[] {
  const linked = [...(row.categories ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((link) => link.category)
    .filter((category): category is CategoryRow => category !== null);
  // The primary category leads even if positions were edited by hand.
  const primary = linked.find((category) => category.id === row.category_id);
  return primary ? [primary, ...linked.filter((category) => category !== primary)] : linked;
}
