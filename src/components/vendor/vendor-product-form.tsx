"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { saveVendorProduct, uploadVendorImage } from "@/app/vendor/actions";
import { Field, FormSection, controlClass, errorProps } from "@/components/admin/field";
import { ImageUploader } from "@/components/admin/image-uploader";
import { SpecRows } from "@/components/admin/spec-rows";
import { Button } from "@/components/ui/button";
import { IDLE_STATE } from "@/lib/admin/form-state";
import type { VendorProduct } from "@/lib/vendor/types";

/** Create or edit one of the signed-in vendor's products. */
export function VendorProductForm({ product }: { product?: VendorProduct }) {
  const [state, formAction, pending] = React.useActionState(saveVendorProduct, IDLE_STATE);
  const [uploading, setUploading] = React.useState(false);
  const errors = state.fieldErrors ?? {};

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    React.startTransition(() => formAction(formData));
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {product && <input type="hidden" name="id" value={product.id} />}

      {state.status === "error" && state.message && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </p>
      )}

      <FormSection title="Basics" description="How Pro Gift sees this product when sourcing for a client.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Product name" htmlFor="name" error={errors.name} className="sm:col-span-2">
            <input
              id="name"
              name="name"
              required
              maxLength={120}
              defaultValue={product?.name}
              placeholder="Executive Ceramic Mug"
              className={controlClass}
              {...errorProps("name", errors.name)}
            />
          </Field>
          <Field label="Your product code" htmlFor="code" error={errors.code} hint="Optional SKU, e.g. MUG-350.">
            <input
              id="code"
              name="code"
              maxLength={32}
              defaultValue={product?.code ?? ""}
              autoCapitalize="characters"
              className={`${controlClass} font-mono uppercase`}
              {...errorProps("code", errors.code)}
            />
          </Field>
          <Field
            label="Description"
            htmlFor="description"
            error={errors.description}
            hint="Materials, colours, sizes, branding options, packaging."
            className="sm:col-span-3"
          >
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={4000}
              defaultValue={product?.description}
              className={`${controlClass} resize-y`}
              {...errorProps("description", errors.description)}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Price range" description="Per-piece price in taka (৳), lowest to highest.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Min price (৳)" htmlFor="price_min" error={errors.price_min}>
            <input
              id="price_min"
              name="price_min"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              required
              defaultValue={product?.priceRange.min}
              className={controlClass}
              {...errorProps("price_min", errors.price_min)}
            />
          </Field>
          <Field label="Max price (৳)" htmlFor="price_max" error={errors.price_max}>
            <input
              id="price_max"
              name="price_max"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              required
              defaultValue={product?.priceRange.max}
              className={controlClass}
              {...errorProps("price_max", errors.price_max)}
            />
          </Field>
          <Field label="Minimum order (pcs)" htmlFor="moq" error={errors.moq}>
            <input
              id="moq"
              name="moq"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              required
              defaultValue={product?.moq ?? 1}
              className={controlClass}
              {...errorProps("moq", errors.moq)}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Specifications" description="Material, size, capacity and so on.">
        {errors.specs && <p className="mb-3 text-xs text-red-700">{errors.specs}</p>}
        <SpecRows name="specs" initial={product?.specs ?? []} />
      </FormSection>

      <FormSection title="Photos" description="The first photo is the cover.">
        {errors.images && <p className="mb-3 text-xs text-red-700">{errors.images}</p>}
        <ImageUploader
          name="images"
          initial={product?.images ?? []}
          onBusyChange={setUploading}
          invalid={Boolean(errors.images)}
          uploadAction={uploadVendorImage}
          discardAction={null}
        />
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t bg-surface/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-xl md:border">
        {uploading && <span className="mr-auto text-xs text-muted-foreground">Waiting for uploads to finish…</span>}
        <Button asChild variant="ghost">
          <Link href="/vendor">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending || uploading}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {product ? "Save changes" : "Add product"}
        </Button>
      </div>
    </form>
  );
}
