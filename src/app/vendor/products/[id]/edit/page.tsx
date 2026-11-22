import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FormSkeleton } from "@/components/admin/form-page";
import { VendorFormHeader } from "@/components/vendor/vendor-form-header";
import { VendorProductForm } from "@/components/vendor/vendor-product-form";
import { getOwnProduct } from "@/lib/vendor/queries";
import { requireVendor } from "@/lib/vendor/session";

export const metadata: Metadata = { title: "Edit product" };

export default function EditVendorProductPage({ params }: PageProps<"/vendor/products/[id]/edit">) {
  return (
    <Suspense
      fallback={
        <>
          <VendorFormHeader title="Edit product" />
          <FormSkeleton />
        </>
      }
    >
      <EditProduct params={params} />
    </Suspense>
  );
}

async function EditProduct({ params }: Pick<PageProps<"/vendor/products/[id]/edit">, "params">) {
  const { token } = await requireVendor();
  const { id } = await params;
  // Only finds the vendor's own products, so another vendor's id is a 404.
  const product = await getOwnProduct(token, id);
  if (!product) notFound();
  return (
    <>
      <VendorFormHeader title={product.name} subtitle={product.code ?? undefined} />
      <VendorProductForm product={product} />
    </>
  );
}
