"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";

import { changeVendorPassword, updateVendorProfile } from "@/app/vendor/actions";
import { Field, FormSection, controlClass, errorProps } from "@/components/admin/field";
import { Button } from "@/components/ui/button";
import { IDLE_STATE } from "@/lib/admin/form-state";
import type { VendorProfile } from "@/lib/vendor/types";
import { formatWhatsAppNumber } from "@/lib/vendor/whatsapp";
import { LogoUploader } from "./logo-uploader";

type Errors = Partial<Record<string, string>>;

/** Business name, WhatsApp, email, address and details: shared by enlistment and the profile editor. */
export function ProfileFields({ errors, vendor }: { errors: Errors; vendor?: VendorProfile }) {
  const emailHint = !vendor
    ? "We'll email you a 6-digit code to confirm it."
    : vendor.email
      ? "Password reset codes are sent here."
      : "Add an email so you can reset a forgotten password.";
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Business name" htmlFor="business_name" error={errors.business_name}>
        <input
          id="business_name"
          name="business_name"
          required
          maxLength={120}
          autoComplete="organization"
          defaultValue={vendor?.businessName}
          className={controlClass}
          {...errorProps("business_name", errors.business_name)}
        />
      </Field>
      <Field
        label="WhatsApp number"
        htmlFor="whatsapp"
        error={errors.whatsapp}
        hint={
          vendor
            ? "Also your sign-in ID: after changing it, sign in with the new number."
            : "This is your sign-in ID. Pro Gift will also message you here about prices."
        }
      >
        <input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          required
          inputMode="tel"
          autoComplete="tel"
          placeholder="01712-345678"
          defaultValue={vendor ? formatWhatsAppNumber(vendor.whatsapp) : undefined}
          className={controlClass}
          {...errorProps("whatsapp", errors.whatsapp)}
        />
      </Field>
      <Field label="Email" htmlFor="email" error={errors.email} hint={emailHint} className="sm:col-span-2">
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="name@company.com"
          defaultValue={vendor?.email ?? undefined}
          className={controlClass}
          {...errorProps("email", errors.email)}
        />
      </Field>
      <Field label="Address" htmlFor="address" error={errors.address} className="sm:col-span-2">
        <input
          id="address"
          name="address"
          required
          maxLength={300}
          autoComplete="street-address"
          placeholder="Shop / house, road, area, city"
          defaultValue={vendor?.address}
          className={controlClass}
          {...errorProps("address", errors.address)}
        />
      </Field>
      <Field
        label="Business details"
        htmlFor="description"
        error={errors.description}
        hint="Optional. What you make or supply, factory or showroom, delivery areas."
        className="sm:col-span-2"
      >
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={2000}
          defaultValue={vendor?.description}
          className={`${controlClass} resize-y`}
          {...errorProps("description", errors.description)}
        />
      </Field>
    </div>
  );
}

export function VendorProfileForm({ vendor }: { vendor: VendorProfile }) {
  const [state, formAction, pending] = React.useActionState(updateVendorProfile, IDLE_STATE);
  const [uploading, setUploading] = React.useState(false);
  const errors = state.fieldErrors ?? {};

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
      <FormSection title="Business profile" description="Shown at the top of your vendor page.">
        <div className="flex flex-col gap-5">
          <LogoUploader
            mode="upload"
            initialUrl={vendor.logoUrl}
            initialPath={vendor.logoPath}
            error={errors.logo_path}
            onBusyChange={setUploading}
          />
          <ProfileFields errors={errors} vendor={vendor} />
        </div>
      </FormSection>
      <div className="flex items-center justify-end gap-3">
        {uploading && <span className="mr-auto text-xs text-muted-foreground">Waiting for the logo upload…</span>}
        <Button asChild variant="ghost">
          <Link href="/vendor">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending || uploading}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Save profile
        </Button>
      </div>
    </form>
  );
}

export function VendorPasswordForm() {
  const [state, formAction, pending] = React.useActionState(changeVendorPassword, IDLE_STATE);
  const errors = state.fieldErrors ?? {};
  return (
    <FormSection title="Password" description="Changing it signs you out on every other device.">
      <form action={formAction} className="grid gap-4 sm:grid-cols-3">
        <Field label="Current password" htmlFor="current_password" error={errors.current_password}>
          <input
            id="current_password"
            name="current_password"
            type="password"
            required
            autoComplete="current-password"
            className={controlClass}
            {...errorProps("current_password", errors.current_password)}
          />
        </Field>
        <Field label="New password" htmlFor="new_password" error={errors.new_password}>
          <input
            id="new_password"
            name="new_password"
            type="password"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            className={controlClass}
            {...errorProps("new_password", errors.new_password)}
          />
        </Field>
        <Field label="Confirm new password" htmlFor="new_password_confirm" error={errors.new_password_confirm}>
          <input
            id="new_password_confirm"
            name="new_password_confirm"
            type="password"
            required
            autoComplete="new-password"
            className={controlClass}
            {...errorProps("new_password_confirm", errors.new_password_confirm)}
          />
        </Field>
        <div className="flex items-center justify-end gap-3 sm:col-span-3">
          <p aria-live="polite" className="mr-auto text-sm">
            {state.status === "success" && (
              <span className="inline-flex items-center gap-1 text-teal">
                <Check className="h-4 w-4" aria-hidden /> {state.message}
              </span>
            )}
            {state.status === "error" && state.message && <span className="text-red-700">{state.message}</span>}
          </p>
          <Button type="submit" variant="outline" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Change password
          </Button>
        </div>
      </form>
    </FormSection>
  );
}
