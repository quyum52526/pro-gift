import type { MetadataRoute } from "next";

import { getCategories, getProducts } from "@/data/products";
import { categoryHref, filterByCategory } from "@/lib/catalog/category-filter";
import { SITE_URL, absoluteUrl } from "@/lib/site";

/** Lists indexable pages only. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  // Home and the gift box builder show the catalogue, so they change when it does.
  const catalogueUpdatedAt = products.map((product) => product.updatedAt).sort().at(-1);

  return [
    {
      url: SITE_URL,
      lastModified: catalogueUpdatedAt,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/gift-box`,
      lastModified: catalogueUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/contact`,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    ...categories.map((category) => {
      // A category page changes when any of its products does.
      const updatedAt = filterByCategory(products, category.slug)
        .map((product) => product.updatedAt)
        .sort()
        .at(-1);
      return {
        url: `${SITE_URL}${categoryHref(category.slug)}`,
        lastModified: updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    }),
    ...products.map((product) => ({
      url: `${SITE_URL}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: product.images.map((image) => absoluteUrl(image.src)),
    })),
  ];
}
