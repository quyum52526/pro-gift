import { Suspense } from "react";
import Link from "next/link";

import { getCategories, getProducts } from "@/data/products";
import { CatalogGrid, CatalogGridSkeleton } from "@/components/product/catalog-grid";
import { HomeHero } from "@/components/home/home-hero";
import { ProductStrip } from "@/components/home/product-strip";

export default async function Home() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <main className="flex-1">
      <HomeHero products={products} />
      <ProductStrip products={products} />
      <div className="mx-auto w-full max-w-[1200px] px-6 pt-8">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-surface-tint p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-ink">Build your own gift box</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a box and products, then preview them with your logo.
            </p>
          </div>
          <Link href="/gift-box" className="pg-btn pg-btn-teal shrink-0">
            Start building
          </Link>
        </div>
      </div>
      <div id="catalog" className="mx-auto w-full max-w-[1200px] scroll-mt-4 px-6 pt-6 pb-16">
        {/* Filtering happens on the client from ?category=, so switching categories is instant. */}
        <Suspense fallback={<CatalogGridSkeleton />}>
          <CatalogGrid products={products} categories={categories} />
        </Suspense>
      </div>
    </main>
  );
}
