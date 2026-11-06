import type { Product, ProductCategory } from "@/types/product";

/** Category page URL, e.g. /category/luxury-boxes; no slug means all gifts on the home page. */
export function categoryHref(slug?: string): string {
  return slug ? `/category/${encodeURIComponent(slug)}` : "/";
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
