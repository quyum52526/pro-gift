import type { Product } from "@/types/product";
import type { ProductRow } from "./types";

const LEAD_TIME_LABEL = "Lead time";

/** Converts a database row to the shape the storefront components use. */
export function rowToProduct(row: ProductRow): Product {
  // Lead time has its own column; the storefront reads it from the specs list.
  const specs =
    row.lead_time && !row.specs.some((spec) => spec.label === LEAD_TIME_LABEL)
      ? [...row.specs, { label: LEAD_TIME_LABEL, value: row.lead_time }]
      : row.specs;

  return {
    id: row.id,
    slug: row.slug,
    code: row.code,
    name: row.name,
    category: row.category
      ? { name: row.category.name, slug: row.category.slug }
      : { name: "Uncategorised", slug: "uncategorised" },
    shortDescription: row.short_description,
    description: row.description,
    priceRange: { min: row.price_min, max: row.price_max },
    moq: row.moq,
    images: row.images.map(({ src, alt, printArea }) => ({ src, alt, printArea })),
    videoUrl: row.video_url ?? undefined,
    tags: [],
    specs,
    brandingMethods: row.branding_methods,
  };
}
