import "server-only";

import type { ProductSpec } from "@/types/product";
import type { StoredImage } from "@/lib/catalog/types";
import { PRODUCT_IMAGES_PUBLIC_PREFIX } from "@/lib/supabase/config";
import { MAX_IMAGES } from "./form-state";

export interface ProductInput {
  name: string;
  code: string;
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
}

type ParseResult =
  | { ok: true; data: ProductInput }
  | { ok: false; fieldErrors: Partial<Record<string, string>> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE = /^[A-Z0-9-]{3,32}$/;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function wholeNumber(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) ? n : null;
}

function parseJsonArray(raw: string): unknown[] | null {
  try {
    const parsed: unknown = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Validates price fields shared by the full form and the inline price editor. */
export function parsePriceRange(formData: FormData) {
  const min = wholeNumber(text(formData, "price_min"));
  const max = wholeNumber(text(formData, "price_max"));
  const fieldErrors: Partial<Record<string, string>> = {};
  if (min === null) fieldErrors.price_min = "Enter a whole taka amount.";
  if (max === null) fieldErrors.price_max = "Enter a whole taka amount.";
  if (min !== null && max !== null && max < min) {
    fieldErrors.price_max = "Max must be at least the min price.";
  }
  return { min, max, fieldErrors };
}

/** Only images in our bucket or bundled in /public/products may be saved. */
function isAllowedImageSrc(src: string): boolean {
  return src.startsWith(PRODUCT_IMAGES_PUBLIC_PREFIX) || /^\/products\/[\w.-]+$/.test(src);
}

function parseImages(raw: string, productName: string): StoredImage[] | null {
  const items = parseJsonArray(raw);
  if (!items) return null;
  const images: StoredImage[] = [];
  for (const [index, item] of items.entries()) {
    if (typeof item !== "object" || item === null) return null;
    const { src, alt, path, printArea } = item as Record<string, unknown>;
    if (typeof src !== "string" || !isAllowedImageSrc(src)) return null;
    // A storage path must match the URL, so cleanup can never delete a different file.
    if (path !== undefined && (typeof path !== "string" || src !== PRODUCT_IMAGES_PUBLIC_PREFIX + path)) {
      return null;
    }
    images.push({
      src,
      alt: typeof alt === "string" && alt.trim() ? alt.trim().slice(0, 160) : `${productName} – image ${index + 1}`,
      ...(typeof path === "string" ? { path } : {}),
      // Print areas aren't editable in the form; existing ones round-trip untouched.
      ...(printArea && typeof printArea === "object" ? { printArea: printArea as StoredImage["printArea"] } : {}),
    });
  }
  return images;
}

function parseSpecs(raw: string): ProductSpec[] | null {
  const items = parseJsonArray(raw);
  if (!items) return null;
  const specs: ProductSpec[] = [];
  for (const item of items) {
    if (typeof item !== "object" || item === null) return null;
    const { label, value } = item as Record<string, unknown>;
    if (typeof label !== "string" || typeof value !== "string") return null;
    const l = label.trim().slice(0, 60);
    const v = value.trim().slice(0, 160);
    if (l && v) specs.push({ label: l, value: v });
  }
  return specs;
}

export function parseProductForm(formData: FormData): ParseResult {
  const fieldErrors: Partial<Record<string, string>> = {};

  const name = text(formData, "name");
  if (name.length < 2 || name.length > 120) fieldErrors.name = "Name must be 2–120 characters.";

  const code = text(formData, "code").toUpperCase();
  if (!CODE.test(code)) fieldErrors.code = "Use 3–32 letters, numbers or dashes, e.g. PG-MUG-101.";

  const category_id = text(formData, "category_id");
  if (!UUID.test(category_id)) fieldErrors.category_id = "Choose a category.";

  const short_description = text(formData, "short_description");
  if (!short_description) fieldErrors.short_description = "Add a one-line summary.";
  else if (short_description.length > 200) fieldErrors.short_description = "Keep it under 200 characters.";

  const description = text(formData, "description");
  if (!description) fieldErrors.description = "Add a description.";

  const price = parsePriceRange(formData);
  Object.assign(fieldErrors, price.fieldErrors);

  const moq = wholeNumber(text(formData, "moq"));
  if (moq === null || moq < 1) fieldErrors.moq = "Minimum order must be at least 1.";

  const leadTime = text(formData, "lead_time").slice(0, 60);

  const videoUrl = text(formData, "video_url");
  if (videoUrl) {
    try {
      if (new URL(videoUrl).protocol !== "https:") throw new Error();
    } catch {
      fieldErrors.video_url = "Use a full https:// link (YouTube or .mp4).";
    }
  }

  const specs = parseSpecs(text(formData, "specs"));
  if (!specs) fieldErrors.specs = "Specifications couldn't be read. Reload and try again.";
  else if (specs.length > 20) fieldErrors.specs = "Up to 20 specification rows.";

  const branding_methods = text(formData, "branding_methods")
    .split(",")
    .map((method) => method.trim())
    .filter(Boolean)
    .slice(0, 10);

  const images = parseImages(text(formData, "images"), name || "Product");
  if (!images) fieldErrors.images = "Images couldn't be read. Reload and try again.";
  else if (images.length === 0) fieldErrors.images = "Add at least one image.";
  else if (images.length > MAX_IMAGES) fieldErrors.images = `Up to ${MAX_IMAGES} images.`;

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  return {
    ok: true,
    data: {
      name,
      code,
      category_id,
      short_description,
      description,
      price_min: price.min!,
      price_max: price.max!,
      moq: moq!,
      lead_time: leadTime || null,
      video_url: videoUrl || null,
      specs: specs!,
      branding_methods,
      images: images!,
    },
  };
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
