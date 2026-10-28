import { cacheLife, cacheTag } from "next/cache";

import { rowToProduct } from "@/lib/catalog/map";
import { PRODUCT_SELECT, type ProductRow } from "@/lib/catalog/types";
import { createPublicClient } from "@/lib/supabase/server";
import type { Product, ProductCategory } from "@/types/product";

/** Tag on every cached catalogue read; admin actions call updateTag() with it. */
export const PRODUCTS_CACHE_TAG = "products";

/*
 * Catalogue reads from Supabase. Pages only depend on getProducts /
 * getProductBySlug / getRelatedProducts, so the source can change freely.
 */
export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheTag(PRODUCTS_CACHE_TAG);
  cacheLife("hours");

  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: true })
    .overrideTypes<ProductRow[], { merge: false }>();

  if (error) throw new Error(`Failed to load products: ${error.message}`);
  return data.map(rowToProduct);
}

/** Categories in display order, for the header tabs and catalogue filter. */
export async function getCategories(): Promise<ProductCategory[]> {
  "use cache";
  cacheTag(PRODUCTS_CACHE_TAG);
  cacheLife("hours");

  const { data, error } = await createPublicClient()
    .from("categories")
    .select("slug, name")
    .order("sort_order", { ascending: true })
    .overrideTypes<ProductCategory[], { merge: false }>();

  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  return data;
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((product) => product.slug === slug);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const others = (await getProducts()).filter((p) => p.slug !== product.slug);
  // Same category first, then the rest.
  const sameCategory = others.filter((p) => p.category.slug === product.category.slug);
  const rest = others.filter((p) => p.category.slug !== product.category.slug);
  return [...sameCategory, ...rest].slice(0, limit);
}
