import { Suspense } from "react";

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
      <div id="catalog" className="mx-auto w-full max-w-[1200px] scroll-mt-4 px-6 pt-6 pb-16">
        {/* Filtering happens on the client from ?category=, so switching categories is instant. */}
        <Suspense fallback={<CatalogGridSkeleton />}>
          <CatalogGrid products={products} categories={categories} />
        </Suspense>
      </div>
    </main>
  );
}
