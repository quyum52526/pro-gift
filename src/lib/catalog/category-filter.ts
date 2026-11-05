import type { Product, ProductCategory } from "@/types/product";

/** Query parameter that selects a category on the catalogue page, e.g. /?category=luxury-boxes. */
export const CATEGORY_PARAM = "category";

/** Catalogue URL for a category; no slug means all gifts. */
export function categoryHref(slug?: string): string {
  return slug ? `/?${CATEGORY_PARAM}=${encodeURIComponent(slug)}` : "/";
}

/** Returns the slug only when it names a known category, so stale or hand-typed URLs fall back to all gifts. */
export function resolveCategorySlug(
  value: string | null | undefined,
  categories: ProductCategory[],
): string | undefined {
  if (!value) return undefined;
  return categories.some((category) => category.slug === value) ? value : undefined;
}

/** True when the product is listed under the category, primary or not. */
export function inCategory(product: Pick<Product, "categories">, slug: string): boolean {
  return product.categories.some((category) => category.slug === slug);
}

/** Products listed under the category; no slug means all gifts. */
export function filterByCategory(products: Product[], slug: string | undefined): Product[] {
  return slug ? products.filter((product) => inCategory(product, slug)) : products;
}

/** The category a product is filed under first: drives breadcrumbs. */
export function primaryCategory(product: Pick<Product, "categories">): ProductCategory {
  return product.categories[0];
}
