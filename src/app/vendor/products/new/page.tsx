import { Suspense } from "react";
import type { Metadata } from "next";

import { FormSkeleton } from "@/components/admin/form-page";
import { VendorFormHeader } from "@/components/vendor/vendor-form-header";
import { VendorProductForm } from "@/components/vendor/vendor-product-form";
import { requireVendor } from "@/lib/vendor/session";

export const metadata: Metadata = { title: "Add product" };

export default function NewVendorProductPage() {
  return (
    <>
      <VendorFormHeader title="Add product" />
      <Suspense fallback={<FormSkeleton />}>
        <NewProduct />
      </Suspense>
    </>
  );
}

async function NewProduct() {
  await requireVendor();
  return <VendorProductForm />;
}
