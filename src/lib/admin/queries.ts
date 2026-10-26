import "server-only";

import { PRODUCT_SELECT, type CategoryRow, type ProductRow } from "@/lib/catalog/types";
import type { AdminSession } from "./auth";

// Admin reads are uncached and run as the admin, so they always show the latest data.

export async function listCategories({ supabase }: AdminSession): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, sort_order")
    .order("sort_order")
    .overrideTypes<CategoryRow[], { merge: false }>();
  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  return data;
}

export async function listProducts({ supabase }: AdminSession): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("name")
    .overrideTypes<ProductRow[], { merge: false }>();
  if (error) throw new Error(`Failed to load products: ${error.message}`);
  return data;
}

export async function getProductById({ supabase }: AdminSession, id: string): Promise<ProductRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle<ProductRow>();
  if (error) throw new Error(`Failed to load product: ${error.message}`);
  return data;
}
