import { Suspense } from "react";
import type { Metadata } from "next";

import { FormPageHeader, FormSkeleton } from "@/components/admin/form-page";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin/auth";
import { listCategories, listProductCodes } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "New product" };

export default function NewProductPage({ searchParams }: PageProps<"/admin/products/new">) {
  return (
    <>
      <FormPageHeader title="New product" />
      <Suspense fallback={<FormSkeleton />}>
        <NewProductForm searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NewProductForm({ searchParams }: Pick<PageProps<"/admin/products/new">, "searchParams">) {
  const admin = await requireAdmin();
  const [categories, existingCodes, params] = await Promise.all([
    listCategories(admin),
    listProductCodes(admin),
    searchParams,
  ]);
  const requested = typeof params.category === "string" ? params.category : undefined;
  const defaultCategoryId = categories.some((c) => c.id === requested) ? requested : undefined;

  return <ProductForm categories={categories} defaultCategoryId={defaultCategoryId} existingCodes={existingCodes} />;
}
