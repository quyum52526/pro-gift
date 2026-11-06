import Link from "next/link";
import { PackageSearch } from "lucide-react";

import { categoryHref } from "@/lib/catalog/category-filter";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/product";
import { ProductCard } from "./product-card";

interface CatalogGridProps {
  products: Product[];
  /** Grid heading: "All Gifts" on the home page, the category name on a category page. */
  heading?: string;
}

/** Product grid. Category pages pass their own products; the home page passes all of them. */
export function CatalogGrid({ products, heading = "All Gifts" }: CatalogGridProps) {
  return (
    <section aria-labelledby="catalog-heading" className="mt-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="catalog-heading" className="text-lg font-semibold text-ink">
          {heading}
        </h2>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>
      </div>

      {products.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed bg-surface-tint/50 px-6 py-16 text-center">
          <PackageSearch className="h-10 w-10 text-teal" aria-hidden />
          <p className="mt-3 font-semibold text-ink">No gifts in this category yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            New items are added regularly. Browse the full range or ask us on WhatsApp for a custom piece.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-5">
            <Link href={categoryHref()}>View all gifts</Link>
          </Button>
        </div>
      )}
    </section>
  );
}

/** Loading shell for the catalogue grid. */
export function CatalogGridSkeleton() {
  return (
    <div className="mt-8 animate-pulse" aria-busy="true" aria-label="Loading products">
      <div className="flex items-baseline justify-between">
        <div className="h-6 w-40 rounded bg-surface-tint" />
        <div className="h-4 w-20 rounded bg-surface-tint" />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border">
            <div className="aspect-square bg-surface-tint" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-16 rounded bg-surface-tint" />
              <div className="h-4 w-3/4 rounded bg-surface-tint" />
              <div className="h-4 w-1/2 rounded bg-surface-tint" />
              <div className="mt-3 h-9 w-full rounded-lg bg-surface-tint" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
