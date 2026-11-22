import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchX } from "lucide-react";

import { VendorSearchForm } from "@/components/admin/vendor-search-form";
import { VendorProductCard, VendorProductGrid } from "@/components/vendor/vendor-product-card";
import { requireAdmin } from "@/lib/admin/auth";
import { searchVendorProducts } from "@/lib/vendor/queries";
import { formatPriceRange } from "@/lib/utils";

export const metadata: Metadata = { title: "Pro Product Search" };

export default function ProProductSearchPage({ searchParams }: PageProps<"/admin/vendors/search">) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Pro Product Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find every vendor carrying a product, compare their price ranges, and WhatsApp them for a client inquiry.
        </p>
      </div>
      <Suspense fallback={<SearchShell query="" />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function SearchShell({ query, children }: { query: string; children?: React.ReactNode }) {
  return (
    <>
      <div className="mt-5">
        <VendorSearchForm defaultValue={query} autoFocus={!query} />
      </div>
      {children}
    </>
  );
}

async function SearchResults({ searchParams }: Pick<PageProps<"/admin/vendors/search">, "searchParams">) {
  const [admin, params] = await Promise.all([requireAdmin(), searchParams]);
  const query = typeof params.q === "string" ? params.q.trim() : "";
  if (!query) {
    return (
      <SearchShell query="">
        <p className="mt-6 text-sm text-muted-foreground">
          Every word must match the product name, code, description, vendor name or vendor ID.
        </p>
      </SearchShell>
    );
  }

  const hits = await searchVendorProducts(admin, query);
  if (hits.length === 0) {
    return (
      <SearchShell query={query}>
        <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-dashed bg-surface px-6 py-12 text-center">
          <SearchX className="h-8 w-8 text-gold-deep" aria-hidden />
          <p className="font-medium text-ink">No vendor products match &ldquo;{query}&rdquo;</p>
          <p className="text-sm text-muted-foreground">Try fewer or shorter words, e.g. &ldquo;mug&rdquo;.</p>
        </div>
      </SearchShell>
    );
  }

  const vendorCount = new Set(hits.map((hit) => hit.vendor.id)).size;
  const lowest = Math.min(...hits.map((hit) => hit.product.priceRange.min));
  const highest = Math.max(...hits.map((hit) => hit.product.priceRange.max));

  return (
    <SearchShell query={query}>
      <p role="status" className="mt-6 mb-4 text-sm text-ink">
        <span className="font-semibold">{hits.length}</span> {hits.length === 1 ? "product" : "products"} from{" "}
        <span className="font-semibold">{vendorCount}</span> {vendorCount === 1 ? "vendor" : "vendors"} ·{" "}
        <span className="text-teal">{formatPriceRange(lowest, highest)}</span>
        <span className="text-muted-foreground"> · cheapest first</span>
      </p>
      <VendorProductGrid>
        {hits.map(({ product, vendor }) => (
          <VendorProductCard key={product.id} product={product} vendor={vendor} showVendor />
        ))}
      </VendorProductGrid>
    </SearchShell>
  );
}
