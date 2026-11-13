import type { MetadataRoute } from "next";

import { blogHref, getAllPosts } from "@/content/blog";
import { getCategories, getProducts } from "@/data/products";
import { categoryHref, filterByCategory } from "@/lib/catalog/category-filter";
import { SITE_URL, absoluteUrl } from "@/lib/site";

/** Lists indexable pages only. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const posts = getAllPosts();

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
    {
      url: `${SITE_URL}/blog`,
      lastModified: posts.map((post) => post.updatedAt).sort().at(-1),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...posts.map((post) => ({
      url: `${SITE_URL}${blogHref(post.slug)}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      images: [absoluteUrl(post.coverImage)],
    })),
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
