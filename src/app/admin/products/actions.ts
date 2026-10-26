"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { PRODUCTS_CACHE_TAG } from "@/data/products";
import { getAdminSession, type AdminSession } from "@/lib/admin/auth";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  type ActionState,
  type UploadResult,
} from "@/lib/admin/form-state";
import { parsePriceRange, parseProductForm, slugify } from "@/lib/admin/product-input";
import type { StoredImage } from "@/lib/catalog/types";
import { PRODUCT_IMAGES_BUCKET, PRODUCT_IMAGES_PUBLIC_PREFIX } from "@/lib/supabase/config";

const NOT_AUTHORISED: ActionState = {
  status: "error",
  message: "Your session has expired or you're not an admin. Sign in again.",
};

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Refreshes the storefront cache and the admin list after a write. */
function refreshCatalogue() {
  updateTag(PRODUCTS_CACHE_TAG);
  revalidatePath("/admin/products");
}

/** Postgres unique violation → a friendly field error. */
function uniqueViolation(message: string): ActionState {
  if (message.includes("products_code_key")) {
    return { status: "error", fieldErrors: { code: "Another product already uses this code." } };
  }
  return { status: "error", message: "A product with these details already exists." };
}

async function uniqueSlug(admin: AdminSession, name: string, code: string): Promise<string> {
  const base = slugify(name) || slugify(code);
  const { data } = await admin.supabase.from("products").select("id").eq("slug", base).maybeSingle();
  return data ? `${base}-${slugify(code)}` : base;
}

/** Deletes storage files that a product no longer references. Best effort. */
async function removeOrphanedImages(admin: AdminSession, before: StoredImage[], after: StoredImage[]) {
  const kept = new Set(after.map((image) => image.path));
  const orphaned = before.map((image) => image.path).filter((path): path is string => !!path && !kept.has(path));
  if (orphaned.length > 0) await admin.supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(orphaned);
}

export async function saveProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getAdminSession();
  if (!admin) return NOT_AUTHORISED;

  const parsed = parseProductForm(formData);
  if (!parsed.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: parsed.fieldErrors };
  }
  const input = parsed.data;
  const id = formData.get("id");

  if (typeof id === "string" && id) {
    const { data: existing, error: readError } = await admin.supabase
      .from("products")
      .select("images")
      .eq("id", id)
      .maybeSingle<{ images: StoredImage[] }>();
    if (readError || !existing) return { status: "error", message: "This product no longer exists." };

    // Slug stays fixed on edit so shared product links keep working.
    const { error } = await admin.supabase.from("products").update(input).eq("id", id);
    if (error) {
      return error.code === "23505" ? uniqueViolation(error.message) : { status: "error", message: error.message };
    }
    await removeOrphanedImages(admin, existing.images, input.images);
  } else {
    const slug = await uniqueSlug(admin, input.name, input.code);
    const { error } = await admin.supabase.from("products").insert({ ...input, slug });
    if (error) {
      return error.code === "23505" ? uniqueViolation(error.message) : { status: "error", message: error.message };
    }
  }

  refreshCatalogue();
  redirect(`/admin/products?saved=${encodeURIComponent(input.code)}`);
}

export async function updatePriceRange(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getAdminSession();
  if (!admin) return NOT_AUTHORISED;

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { status: "error", message: "Missing product." };

  const { min, max, fieldErrors } = parsePriceRange(formData);
  if (min === null || max === null || Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: Object.values(fieldErrors)[0], fieldErrors };
  }

  const { data, error } = await admin.supabase
    .from("products")
    .update({ price_min: min, price_max: max })
    .eq("id", id)
    .select("id");
  if (error) return { status: "error", message: error.message };
  if (!data?.length) return { status: "error", message: "Product not found." };

  refreshCatalogue();
  return { status: "success", message: "Saved" };
}

/** Uploads one image to Storage. Called once per file so each request stays small. */
export async function uploadProductImage(formData: FormData): Promise<UploadResult> {
  const admin = await getAdminSession();
  if (!admin) return { ok: false, error: NOT_AUTHORISED.message! };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "No file received." };
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: "Use JPG, PNG, WebP or AVIF." };
  }
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "Image is larger than 4 MB." };

  const now = new Date();
  const path = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${EXTENSIONS[file.type]}`;

  const { error } = await admin.supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) return { ok: false, error: error.message };

  return { ok: true, image: { src: PRODUCT_IMAGES_PUBLIC_PREFIX + path, path } };
}

/**
 * Removes an image uploaded during this edit that was discarded before saving.
 * Files still referenced by a saved product are left alone.
 */
export async function discardUploadedImage(path: string): Promise<void> {
  const admin = await getAdminSession();
  if (!admin || typeof path !== "string" || !/^\d{4}\/\d{2}\/[\w-]+\.\w+$/.test(path)) return;

  const { data } = await admin.supabase
    .from("products")
    .select("id")
    .contains("images", [{ path }])
    .limit(1);
  if (data?.length) return;

  await admin.supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
}
