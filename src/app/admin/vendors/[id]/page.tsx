import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PackageOpen, Power } from "lucide-react";

import { VendorProductCard, VendorProductGrid } from "@/components/vendor/vendor-product-card";
import { VendorProfileHeader } from "@/components/vendor/vendor-profile-header";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/auth";
import { getVendorWithProducts } from "@/lib/vendor/queries";
import { setVendorActive } from "../actions";

export const metadata: Metadata = { title: "Vendor" };

export default function AdminVendorPage({ params }: PageProps<"/admin/vendors/[id]">) {
  return (
    <>
      <Link
        href="/admin/vendors"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-teal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> All vendors
      </Link>
      <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl border bg-surface" aria-busy="true" />}>
        <VendorDetail params={params} />
      </Suspense>
    </>
  );
}

async function VendorDetail({ params }: Pick<PageProps<"/admin/vendors/[id]">, "params">) {
  const admin = await requireAdmin();
  const { id } = await params;
  const result = await getVendorWithProducts(admin, id);
  if (!result) notFound();
  const { vendor, products } = result;

  return (
    <div className="flex flex-col gap-6">
      <VendorProfileHeader
        vendor={vendor}
        productCount={products.length}
        showContact
        actions={
          <form action={setVendorActive}>
            <input type="hidden" name="id" value={vendor.id} />
            <input type="hidden" name="active" value={vendor.isActive ? "false" : "true"} />
            <Button type="submit" variant="outline" size="sm" className="w-full">
              <Power className="h-3.5 w-3.5" /> {vendor.isActive ? "Disable vendor" : "Enable vendor"}
            </Button>
          </form>
        }
      />

      <section aria-labelledby="vendor-products-heading" className="flex flex-col gap-4">
        <h2 id="vendor-products-heading" className="text-xl font-bold tracking-tight text-ink">
          Products
        </h2>
        {products.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed bg-surface px-4 py-6 text-sm text-muted-foreground">
            <PackageOpen className="h-5 w-5 text-gold-deep" aria-hidden />
            This vendor hasn&apos;t added any products yet.
          </div>
        ) : (
          <VendorProductGrid>
            {products.map((product) => (
              <VendorProductCard key={product.id} product={product} vendor={vendor} />
            ))}
          </VendorProductGrid>
        )}
      </section>
    </div>
  );
}
