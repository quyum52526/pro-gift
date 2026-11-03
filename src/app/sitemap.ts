import type { MetadataRoute } from "next";

import { getProducts } from "@/data/products";
import { SITE_URL, absoluteUrl } from "@/lib/site";

/** Lists indexable pages only. Category filters are /?category= views of the home page, so they are left out. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();

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
    ...products.map((product) => ({
      url: `${SITE_URL}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: product.images.map((image) => absoluteUrl(image.src)),
    })),
  ];
}
