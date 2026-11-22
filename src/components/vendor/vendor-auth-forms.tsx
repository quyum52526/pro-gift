"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { registerVendor, signInVendor } from "@/app/vendor/actions";
import { Field, controlClass, errorProps } from "@/components/admin/field";
import { Button } from "@/components/ui/button";
import { IDLE_STATE } from "@/lib/admin/form-state";
import { cn } from "@/lib/utils";
import { LogoUploader } from "./logo-uploader";
import { ProfileFields } from "./vendor-profile-form";

type Tab = "signin" | "enlist";

/** Sign in with a vendor ID, or enlist as a new vendor. */
export function VendorAuthForms({ initialTab = "signin" }: { initialTab?: Tab }) {
  const [tab, setTab] = React.useState<Tab>(initialTab);
  return (
    <div className="rounded-2xl border bg-surface shadow-card">
      <div role="tablist" aria-label="Vendor access" className="grid grid-cols-2 border-b">
        {(
          [
            ["signin", "Vendor sign in"],
            ["enlist", "Enlist as a vendor"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            id={`tab-${value}`}
            aria-selected={tab === value}
            aria-controls={`panel-${value}`}
            onClick={() => setTab(value)}
            className={cn(
              "h-12 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
              tab === value ? "border-b-2 border-teal text-teal" : "text-muted-foreground hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="p-5 md:p-6">
        {tab === "signin" ? <SignInForm /> : <EnlistForm />}
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {message}
    </p>
  );
}

function SignInForm() {
  const [state, formAction, pending] = React.useActionState(signInVendor, IDLE_STATE);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.status === "error" && <ErrorBanner message={state.message} />}
      <Field label="Vendor ID" htmlFor="code" hint="The PGV-XXXXXX code you got when you enlisted.">
        <input
          id="code"
          name="code"
          required
          autoComplete="username"
          autoCapitalize="characters"
          placeholder="PGV-XXXXXX"
          className={`${controlClass} font-mono uppercase`}
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={controlClass}
        />
      </Field>
      <Button type="submit" disabled={pending} className="mt-1">
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Sign in
      </Button>
      <p className="text-xs text-muted-foreground">
        Forgot your password? Message Pro Gift on WhatsApp from your registered number and we&apos;ll help.
      </p>
    </form>
  );
}

function EnlistForm() {
  const [state, formAction, pending] = React.useActionState(registerVendor, IDLE_STATE);
  const errors = state.fieldErrors ?? {};

  // startTransition (not the `action` prop) keeps typed values after a validation error.
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    React.startTransition(() => formAction(formData));
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {state.status === "error" && <ErrorBanner message={state.message} />}
      <ProfileFields errors={errors} />
      <LogoUploader mode="file" error={errors.logo} />
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
      <Button type="submit" disabled={pending} className="mt-1">
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Create vendor profile
      </Button>
      <p className="text-xs text-muted-foreground">
        Your profile and products are private: only you and the Pro Gift team can see them. They never appear in the
        public catalogue.
      </p>
    </form>
  );
}
