import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FormPageHeader, FormSkeleton } from "@/components/admin/form-page";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin/auth";
import { getProductById, listCategories } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Edit product" };

export default function EditProductPage({ params }: PageProps<"/admin/products/[id]/edit">) {
  return (
    <Suspense
      fallback={
        <>
          <FormPageHeader title="Edit product" />
          <FormSkeleton />
        </>
      }
    >
      <EditProductForm params={params} />
    </Suspense>
  );
}

async function EditProductForm({ params }: Pick<PageProps<"/admin/products/[id]/edit">, "params">) {
  const admin = await requireAdmin();
  const { id } = await params;
  const [categories, product] = await Promise.all([listCategories(admin), getProductById(admin, id)]);
  if (!product) notFound();

  return (
    <>
      <FormPageHeader title={product.name} subtitle={product.code} />
      <ProductForm categories={categories} product={product} />
    </>
  );
}
