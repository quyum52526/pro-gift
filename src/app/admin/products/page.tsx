import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ExternalLink, PackageOpen, Pencil, Plus } from "lucide-react";

import { PriceEditor } from "@/components/admin/price-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/auth";
import { listCategories, listProducts } from "@/lib/admin/queries";
import type { CategoryRow, ProductRow } from "@/lib/catalog/types";

export const metadata: Metadata = { title: "Products" };

export default function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit prices inline, or open a product to change its details and images.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" /> New product
          </Link>
        </Button>
      </div>

      <Suspense fallback={<ListSkeleton />}>
        <ProductList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ProductList({ searchParams }: Pick<PageProps<"/admin/products">, "searchParams">) {
  const admin = await requireAdmin();
  const [categories, products, params] = await Promise.all([
    listCategories(admin),
    listProducts(admin),
    searchParams,
  ]);
  const saved = typeof params.saved === "string" ? params.saved : null;

  const byCategory = new Map<string, ProductRow[]>();
  for (const product of products) {
    const list = byCategory.get(product.category_id) ?? [];
    list.push(product);
    byCategory.set(product.category_id, list);
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      {saved && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border border-teal/30 bg-surface px-4 py-3 text-sm text-ink"
        >
          <CheckCircle2 className="h-4 w-4 text-teal" aria-hidden />
          Saved <span className="font-mono font-medium">{saved}</span>. The storefront is updated.
        </p>
      )}

      {categories.map((category) => (
        <CategoryGroup key={category.id} category={category} products={byCategory.get(category.id) ?? []} />
      ))}
    </div>
  );
}

function CategoryGroup({ category, products }: { category: CategoryRow; products: ProductRow[] }) {
  const headingId = `category-${category.slug}`;
  return (
    <section aria-labelledby={headingId} className="overflow-hidden rounded-xl border bg-surface">
      <header className="flex items-center justify-between gap-3 border-b bg-surface-tint/60 px-4 py-3">
        <h2 id={headingId} className="font-semibold text-ink">
          {category.name}
        </h2>
        <Badge variant={products.length ? "secondary" : "outline"}>
          {products.length} {products.length === 1 ? "product" : "products"}
        </Badge>
      </header>

      {products.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-5 text-sm text-muted-foreground">
          <PackageOpen className="h-5 w-5 text-gold-deep" aria-hidden />
          No products yet.
          <Link
            href={`/admin/products/new?category=${category.id}`}
            className="font-medium text-teal hover:underline"
          >
            Add one
          </Link>
        </div>
      ) : (
        <ul className="divide-y">
          {products.map((product) => (
            <li
              key={product.id}
              className="grid grid-cols-[3rem_1fr] items-center gap-x-4 gap-y-3 px-4 py-3 md:grid-cols-[3rem_1fr_auto_auto]"
            >
              <div className="h-12 w-12 overflow-hidden rounded-lg border bg-surface-tint">
                {product.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.images[0].src} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{product.name}</p>
                <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  <span className="font-mono">{product.code}</span>
                  <span>MOQ {product.moq}</span>
                  {product.lead_time && <span>{product.lead_time}</span>}
                </p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <PriceEditor
                  productId={product.id}
                  productName={product.name}
                  min={product.price_min}
                  max={product.price_max}
                />
              </div>
              <div className="col-span-2 flex justify-end gap-1 md:col-span-1">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/products/${product.slug}`} target="_blank" aria-label={`View ${product.name} on the site`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/products/${product.id}/edit`}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ListSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-6" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-40 animate-pulse rounded-xl border bg-surface" />
      ))}
    </div>
  );
}
