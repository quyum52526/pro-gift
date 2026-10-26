/** Icon keys resolved to Lucide icons on the client, so product data stays serializable. */
export type ProductTagIcon = "tag" | "palette" | "package" | "sparkles" | "ruler" | "leaf";

export interface ProductTag {
  label: string;
  icon?: ProductTagIcon;
}

/** Logo print zone, in percent of the image box (0–100). */
export interface PrintArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProductImage {
  src: string;
  alt: string;
  /** Present on images that can show a live logo mockup. */
  printArea?: PrintArea;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  /** Database id; absent for products that never came from Supabase. */
  id?: string;
  slug: string;
  code: string;
  name: string;
  category: { name: string; slug: string };
  shortDescription: string;
  description: string;
  priceRange: PriceRange;
  /** Minimum order quantity. */
  moq: number;
  images: ProductImage[];
  /** 360° spin or demo video: a YouTube link or a direct .mp4/.webm URL. */
  videoUrl?: string;
  tags: ProductTag[];
  specs: ProductSpec[];
  brandingMethods: string[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
