// Referenced as literal `process.env.NEXT_PUBLIC_*` so Next can inline them in client bundles.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local.",
  );
}

export const SUPABASE_URL = url.replace(/\/+$/, "");
export const SUPABASE_ANON_KEY = anonKey;

export const PRODUCT_IMAGES_BUCKET = "product-images";

/** Public URL prefix of every file in the product image bucket. */
export const PRODUCT_IMAGES_PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
