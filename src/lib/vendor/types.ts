import type { ProductSpec } from "@/types/product";
import { VENDOR_IMAGES_PUBLIC_PREFIX } from "@/lib/supabase/config";

/** Image entry stored in vendor_products.images. Only the storage path is kept; the URL is built here. */
export interface VendorStoredImage {
  path: string;
  alt: string;
}

/** Row shape of public.vendors. */
export interface VendorRow {
  id: string;
  code: string;
  business_name: string;
  logo_path: string | null;
  address: string;
  whatsapp: string;
  email: string | null;
  email_verified_at: string | null;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Row shape of public.vendor_products. */
export interface VendorProductRow {
  id: string;
  vendor_id: string;
  code: string | null;
  name: string;
  description: string;
  price_min: number;
  price_max: number;
  moq: number;
  specs: ProductSpec[];
  images: VendorStoredImage[];
  created_at: string;
  updated_at: string;
}

/** Row returned by pro_gift_admin_search_vendor_products(). */
export interface VendorSearchRow {
  product_id: string;
  product_code: string | null;
  product_name: string;
  product_description: string;
  price_min: number;
  price_max: number;
  moq: number;
  specs: ProductSpec[];
  images: VendorStoredImage[];
  updated_at: string;
  vendor_id: string;
  vendor_code: string;
  vendor_name: string;
  vendor_whatsapp: string;
  vendor_logo_path: string | null;
  vendor_address: string;
  vendor_active: boolean;
}

export const VENDOR_COLUMNS =
  "id, code, business_name, logo_path, address, whatsapp, email, email_verified_at, description, is_active, created_at, updated_at";

/** What the vendor page and cards render. */
export interface VendorProfile {
  id: string;
  code: string;
  businessName: string;
  logoUrl: string | null;
  logoPath: string | null;
  address: string;
  /** Digits only (8801XXXXXXXXX). Also the vendor's sign-in ID. */
  whatsapp: string;
  email: string | null;
  emailVerified: boolean;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface VendorProductImage {
  src: string;
  path: string;
  alt: string;
}

export interface VendorProduct {
  id: string;
  vendorId: string;
  code: string | null;
  name: string;
  description: string;
  priceRange: { min: number; max: number };
  moq: number;
  specs: ProductSpec[];
  images: VendorProductImage[];
  updatedAt: string;
}

export function vendorImageUrl(path: string): string {
  return VENDOR_IMAGES_PUBLIC_PREFIX + path;
}

export function rowToVendor(row: VendorRow): VendorProfile {
  return {
    id: row.id,
    code: row.code,
    businessName: row.business_name,
    logoUrl: row.logo_path ? vendorImageUrl(row.logo_path) : null,
    logoPath: row.logo_path,
    address: row.address,
    whatsapp: row.whatsapp,
    email: row.email ?? null,
    emailVerified: Boolean(row.email_verified_at),
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function toImages(images: VendorStoredImage[] | null, name: string): VendorProductImage[] {
  return (images ?? [])
    .filter((image) => typeof image?.path === "string")
    .map((image, index) => ({
      src: vendorImageUrl(image.path),
      path: image.path,
      alt: image.alt?.trim() || `${name}${index > 0 ? ` (photo ${index + 1})` : ""}`,
    }));
}

export function rowToVendorProduct(row: VendorProductRow): VendorProduct {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    code: row.code,
    name: row.name,
    description: row.description,
    priceRange: { min: row.price_min, max: row.price_max },
    moq: row.moq,
    specs: row.specs ?? [],
    images: toImages(row.images, row.name),
    updatedAt: row.updated_at,
  };
}

/** A search hit split back into the product and the vendor carrying it. */
export function searchRowToHit(row: VendorSearchRow): { product: VendorProduct; vendor: VendorProfile } {
  return {
    product: {
      id: row.product_id,
      vendorId: row.vendor_id,
      code: row.product_code,
      name: row.product_name,
      description: row.product_description,
      priceRange: { min: row.price_min, max: row.price_max },
      moq: row.moq,
      specs: row.specs ?? [],
      images: toImages(row.images, row.product_name),
      updatedAt: row.updated_at,
    },
    vendor: {
      id: row.vendor_id,
      code: row.vendor_code,
      businessName: row.vendor_name,
      logoUrl: row.vendor_logo_path ? vendorImageUrl(row.vendor_logo_path) : null,
      logoPath: row.vendor_logo_path,
      address: row.vendor_address,
      whatsapp: row.vendor_whatsapp,
      email: null,
      emailVerified: false,
      description: "",
      isActive: row.vendor_active,
      createdAt: "",
    },
  };
}
