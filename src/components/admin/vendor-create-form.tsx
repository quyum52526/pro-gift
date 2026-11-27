"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { createVendorByAdmin } from "@/app/admin/vendors/actions";
import { Field, FormSection, controlClass, errorProps } from "@/components/admin/field";
import { LogoUploader } from "@/components/vendor/logo-uploader";
import { Button } from "@/components/ui/button";
import { IDLE_STATE } from "@/lib/admin/form-state";

/** Admin "Create vendor": saves the account straight away, without an email code. */
export function VendorCreateForm() {
  const [state, formAction, pending] = React.useActionState(createVendorByAdmin, IDLE_STATE);
  const errors = state.fieldErrors ?? {};

  // startTransition (not the `action` prop) keeps typed values and the chosen logo after an error.
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    React.startTransition(() => formAction(formData));
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {state.status === "error" && state.message && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </p>
      )}

      <FormSection title="Business" description="Only Pro Gift admins and the vendor can see these details.">
        <div className="flex flex-col gap-5">
          <LogoUploader mode="file" error={errors.logo} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business name" htmlFor="business_name" error={errors.business_name}>
              <input
                id="business_name"
                name="business_name"
                required
                maxLength={120}
                autoComplete="off"
                className={controlClass}
                {...errorProps("business_name", errors.business_name)}
              />
            </Field>
            <Field
              label="WhatsApp number"
              htmlFor="whatsapp"
              error={errors.whatsapp}
              hint="The vendor's sign-in ID. Saved as 8801XXXXXXXXX."
            >
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                required
                inputMode="tel"
                autoComplete="off"
                placeholder="01712-345678"
                className={controlClass}
                {...errorProps("whatsapp", errors.whatsapp)}
              />
            </Field>
            <Field
              label="Email"
              htmlFor="email"
              error={errors.email}
              hint="Optional. Saved as verified, with no code sent. Password reset and change codes go here."
              className="sm:col-span-2"
            >
              <input
                id="email"
                name="email"
                type="email"
                maxLength={254}
                autoComplete="off"
                placeholder="name@company.com"
                className={controlClass}
                {...errorProps("email", errors.email)}
              />
            </Field>
            <Field label="Address" htmlFor="address" error={errors.address} hint="Optional." className="sm:col-span-2">
              <input
                id="address"
                name="address"
                maxLength={300}
                autoComplete="off"
                placeholder="Shop / house, road, area, city"
                className={controlClass}
                {...errorProps("address", errors.address)}
              />
            </Field>
            <Field
              label="Business details"
              htmlFor="description"
              error={errors.description}
              hint="Optional. What they make or supply, factory or showroom, delivery areas."
              className="sm:col-span-2"
            >
              <textarea
                id="description"
                name="description"
                rows={3}
                maxLength={2000}
                className={`${controlClass} resize-y`}
                {...errorProps("description", errors.description)}
              />
            </Field>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Initial password"
        description="Share it with the vendor privately. They can change it later from their profile with an email code."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" htmlFor="password" error={errors.password} hint="8 characters or more.">
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              className={controlClass}
              {...errorProps("password", errors.password)}
            />
          </Field>
          <Field label="Confirm password" htmlFor="password_confirm" error={errors.password_confirm}>
            <input
              id="password_confirm"
              name="password_confirm"
              type="password"
              required
              autoComplete="new-password"
              className={controlClass}
              {...errorProps("password_confirm", errors.password_confirm)}
            />
          </Field>
        </div>
      </FormSection>

      <div className="flex items-center justify-end gap-3">
        <Button asChild variant="ghost">
          <Link href="/admin/vendors">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Create vendor
        </Button>
      </div>
    </form>
  );
}
