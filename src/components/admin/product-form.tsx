"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { saveProduct } from "@/app/admin/products/actions";
import { Button } from "@/components/ui/button";
import { IDLE_STATE } from "@/lib/admin/form-state";
import type { CategoryRow, ProductRow } from "@/lib/catalog/types";
import { Field, FormSection, controlClass, errorProps } from "./field";
import { ImageUploader } from "./image-uploader";
import { SpecRows } from "./spec-rows";

interface ProductFormProps {
  categories: CategoryRow[];
  /** Omit to create a new product. */
  product?: ProductRow;
  /** Pre-selected category for new products. */
  defaultCategoryId?: string;
}

export function ProductForm({ categories, product, defaultCategoryId }: ProductFormProps) {
  const [state, formAction, pending] = React.useActionState(saveProduct, IDLE_STATE);
  const [uploading, setUploading] = React.useState(false);
  const errors = state.fieldErrors ?? {};

  // Submitting through startTransition (not the `action` prop) skips React's
  // automatic form reset, so typed values survive a validation error.
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

      <FormSection title="Basics" description="How the product appears in the catalogue.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product name" htmlFor="name" error={errors.name} className="sm:col-span-2">
            <input
              id="name"
              name="name"
              required
              defaultValue={product?.name}
              placeholder="Executive Ceramic Mug"
              className={controlClass}
              {...errorProps("name", errors.name)}
            />
          </Field>
          <Field label="Category" htmlFor="category_id" error={errors.category_id}>
            <select
              id="category_id"
              name="category_id"
              required
              defaultValue={product?.category_id ?? defaultCategoryId ?? ""}
              className={controlClass}
              {...errorProps("category_id", errors.category_id)}
            >
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Product code" htmlFor="code" error={errors.code} hint="Shown to customers, e.g. PG-MUG-101.">
            <input
              id="code"
              name="code"
              required
              defaultValue={product?.code}
              placeholder="PG-XXX-000"
              autoCapitalize="characters"
              className={`${controlClass} font-mono uppercase`}
              {...errorProps("code", errors.code)}
            />
          </Field>
          <Field
            label="Short description"
            htmlFor="short_description"
            error={errors.short_description}
            hint="One line for cards and search results."
            className="sm:col-span-2"
          >
            <input
              id="short_description"
              name="short_description"
              required
              maxLength={200}
              defaultValue={product?.short_description}
              className={controlClass}
              {...errorProps("short_description", errors.short_description)}
            />
          </Field>
          <Field label="Description" htmlFor="description" error={errors.description} className="sm:col-span-2">
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              defaultValue={product?.description}
              className={`${controlClass} resize-y`}
              {...errorProps("description", errors.description)}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Pricing & ordering" description="Per-piece price range in taka (৳).">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Min price (৳)" htmlFor="price_min" error={errors.price_min}>
            <input
              id="price_min"
              name="price_min"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              required
              defaultValue={product?.price_min}
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
              defaultValue={product?.price_max}
              className={controlClass}
              {...errorProps("price_max", errors.price_max)}
            />
          </Field>
          <Field label="MOQ (pcs)" htmlFor="moq" error={errors.moq}>
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
          <Field label="Lead time" htmlFor="lead_time" error={errors.lead_time}>
            <input
              id="lead_time"
              name="lead_time"
              defaultValue={product?.lead_time ?? ""}
              placeholder="7–10 working days"
              className={controlClass}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Specifications" description="Shown as a table on the product page.">
        {errors.specs && <p className="mb-3 text-xs text-red-700">{errors.specs}</p>}
        <SpecRows name="specs" initial={product?.specs ?? []} />
        <Field
          label="Branding methods"
          htmlFor="branding_methods"
          hint="Comma-separated, e.g. Laser engraving, UV print"
          className="mt-5"
        >
          <input
            id="branding_methods"
            name="branding_methods"
            defaultValue={product?.branding_methods.join(", ")}
            className={controlClass}
          />
        </Field>
      </FormSection>

      <FormSection title="Media" description="Product photos and the 360° / demo video.">
        {errors.images && <p className="mb-3 text-xs text-red-700">{errors.images}</p>}
        <ImageUploader
          name="images"
          initial={product?.images ?? []}
          onBusyChange={setUploading}
          invalid={Boolean(errors.images)}
        />
        <Field
          label="Video link"
          htmlFor="video_url"
          error={errors.video_url}
          hint="YouTube link or direct .mp4 URL. Optional."
          className="mt-5"
        >
          <input
            id="video_url"
            name="video_url"
            type="url"
            defaultValue={product?.video_url ?? ""}
            placeholder="https://www.youtube.com/watch?v=…"
            className={controlClass}
            {...errorProps("video_url", errors.video_url)}
          />
        </Field>
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t bg-surface/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-xl md:border">
        {uploading && <span className="mr-auto text-xs text-muted-foreground">Waiting for uploads to finish…</span>}
        <Button asChild variant="ghost">
          <Link href="/admin/products">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending || uploading}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {product ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
