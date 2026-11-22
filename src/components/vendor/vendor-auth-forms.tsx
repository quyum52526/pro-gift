"use client";

import * as React from "react";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";

import {
  completePasswordReset,
  signInVendor,
  startPasswordReset,
  startVendorSignup,
  verifyVendorSignup,
} from "@/app/vendor/actions";
import { Field, controlClass, errorProps } from "@/components/admin/field";
import { Button } from "@/components/ui/button";
import { IDLE_STATE } from "@/lib/admin/form-state";
import { IDLE_OTP_STATE, type OtpStartState } from "@/lib/vendor/otp-state";
import { cn } from "@/lib/utils";
import { LogoUploader } from "./logo-uploader";
import { ProfileFields } from "./vendor-profile-form";

type Tab = "signin" | "enlist";

/** Sign in with a WhatsApp number, reset a forgotten password, or enlist as a new vendor. */
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
        {tab === "signin" ? <SignInPanel /> : <EnlistForm />}
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

function SentBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="status" className="flex gap-2 rounded-lg border border-teal/30 bg-surface-tint px-3 py-2 text-sm text-ink">
      <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
      {message}
    </p>
  );
}

function OtpField({ error }: { error?: string }) {
  return (
    <Field label="6-digit code" htmlFor="otp" error={error} hint="Check your inbox and spam folder.">
      <input
        id="otp"
        name="otp"
        required
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        placeholder="123456"
        className={`${controlClass} font-mono text-lg tracking-[0.4em]`}
        {...errorProps("otp", error)}
      />
    </Field>
  );
}

/**
 * Step 1 of an email-code flow. The step-1 form stays mounted (hidden) on the
 * code screen, so "Send a new code" can re-submit it and "Change details" shows
 * it again with everything still filled in, including a chosen logo file.
 */
function useOtpStart(action: (prev: OtpStartState, formData: FormData) => Promise<OtpStartState>) {
  const [state, dispatch, pending] = React.useActionState(action, IDLE_OTP_STATE);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const resendRef = React.useRef(false);

  const onCode = state.step === "code" && Boolean(state.requestId) && state.requestId !== editingId;

  // startTransition (not the `action` prop) keeps typed values after a validation error.
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (resendRef.current && state.requestId) formData.set("request_id", state.requestId);
    resendRef.current = false;
    React.startTransition(() => dispatch(formData));
  };

  return {
    state,
    pending,
    formRef,
    onSubmit,
    onCode,
    resend: () => {
      resendRef.current = true;
      formRef.current?.requestSubmit();
    },
    edit: () => setEditingId(state.requestId ?? null),
  };
}

function CodeStepLinks({
  onResend,
  onEdit,
  resending,
  editLabel,
}: {
  onResend: () => void;
  onEdit: () => void;
  resending: boolean;
  editLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <button
        type="button"
        onClick={onResend}
        disabled={resending}
        className="inline-flex items-center gap-1.5 font-medium text-teal hover:underline disabled:opacity-50"
      >
        {resending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
        Send a new code
      </button>
      <button type="button" onClick={onEdit} className="text-muted-foreground hover:text-ink hover:underline">
        {editLabel}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- sign in + forgot password

function SignInPanel() {
  const [forgot, setForgot] = React.useState(false);
  return forgot ? <ForgotPassword onBack={() => setForgot(false)} /> : <SignInForm onForgot={() => setForgot(true)} />;
}

function LoginField({ error }: { error?: string }) {
  return (
    <Field
      label="WhatsApp number"
      htmlFor="login"
      error={error}
      hint="The number you enlisted with. An older PGV-XXXXXX vendor ID also works."
    >
      <input
        id="login"
        name="login"
        type="tel"
        required
        inputMode="tel"
        autoComplete="username"
        placeholder="01712-345678"
        className={controlClass}
        {...errorProps("login", error)}
      />
    </Field>
  );
}

function SignInForm({ onForgot }: { onForgot: () => void }) {
  const [state, formAction, pending] = React.useActionState(signInVendor, IDLE_STATE);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.status === "error" && <ErrorBanner message={state.message} />}
      <LoginField />
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
      <button
        type="button"
        onClick={onForgot}
        className="self-start text-sm font-medium text-teal hover:underline"
      >
        Forgot password?
      </button>
    </form>
  );
}

function ForgotPassword({ onBack }: { onBack: () => void }) {
  const { state, pending, formRef, onSubmit, onCode, resend, edit } = useOtpStart(startPasswordReset);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to sign in
        </button>
        <h2 className="mt-2 text-lg font-semibold text-ink">Reset your password</h2>
      </div>

      <form
        ref={formRef}
        onSubmit={onSubmit}
        noValidate
        className={onCode ? "hidden" : "flex flex-col gap-4"}
      >
        <p className="text-sm text-muted-foreground">
          We&apos;ll email a 6-digit code to the address on your vendor account.
        </p>
        {!onCode && state.status === "error" && <ErrorBanner message={state.message} />}
        <Field
          label="WhatsApp number or email"
          htmlFor="reset_login"
          error={state.fieldErrors?.login}
          hint="No email on your account yet? Message Pro Gift on WhatsApp from your registered number."
        >
          <input
            id="reset_login"
            name="login"
            required
            autoComplete="username"
            placeholder="01712-345678 or name@company.com"
            className={controlClass}
            {...errorProps("login", state.fieldErrors?.login)}
          />
        </Field>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Email me a code
        </Button>
      </form>

      {onCode && state.requestId && (
        <ResetCodeStep
          key={state.requestId}
          requestId={state.requestId}
          sentMessage={state.status === "success" ? state.message : undefined}
          startError={state.status === "error" ? state.message : undefined}
          resending={pending}
          onResend={resend}
          onEdit={edit}
        />
      )}
    </div>
  );
}

function ResetCodeStep({
  requestId,
  sentMessage,
  startError,
  resending,
  onResend,
  onEdit,
}: {
  requestId: string;
  sentMessage?: string;
  startError?: string;
  resending: boolean;
  onResend: () => void;
  onEdit: () => void;
}) {
  const [state, formAction, pending] = React.useActionState(completePasswordReset, IDLE_STATE);
  const errors = state.fieldErrors ?? {};

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    React.startTransition(() => formAction(formData));
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <SentBanner message={sentMessage} />
      <ErrorBanner message={startError ?? (state.status === "error" ? state.message : undefined)} />
      <input type="hidden" name="request_id" value={requestId} />
      <OtpField error={errors.otp} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password" htmlFor="new_password" error={errors.new_password} hint="8 characters or more.">
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
      </div>
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Set new password
      </Button>
      <CodeStepLinks onResend={onResend} onEdit={onEdit} resending={resending} editLabel="Use a different number" />
    </form>
  );
}

// ---------------------------------------------------------------- enlist

function EnlistForm() {
  const { state, pending, formRef, onSubmit, onCode, resend, edit } = useOtpStart(startVendorSignup);
  const errors = state.fieldErrors ?? {};

  return (
    <>
      <form
        ref={formRef}
        onSubmit={onSubmit}
        noValidate
        className={onCode ? "hidden" : "flex flex-col gap-4"}
      >
        {!onCode && state.status === "error" && <ErrorBanner message={state.message} />}
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
          Email me a code
        </Button>
        <p className="text-xs text-muted-foreground">
          Your profile and products are private: only you and the Pro Gift team can see them. They never appear in
          the public catalogue.
        </p>
      </form>

      {onCode && state.requestId && (
        <SignupCodeStep
          key={state.requestId}
          requestId={state.requestId}
          email={state.email}
          sentMessage={state.status === "success" ? state.message : undefined}
          startError={state.status === "error" ? state.message : undefined}
          detailsForm={formRef}
          resending={pending}
          onResend={resend}
          onEdit={edit}
        />
      )}
    </>
  );
}

function SignupCodeStep({
  requestId,
  email,
  sentMessage,
  startError,
  detailsForm,
  resending,
  onResend,
  onEdit,
}: {
  requestId: string;
  email?: string;
  sentMessage?: string;
  startError?: string;
  detailsForm: React.RefObject<HTMLFormElement | null>;
  resending: boolean;
  onResend: () => void;
  onEdit: () => void;
}) {
  const [state, formAction, pending] = React.useActionState(verifyVendorSignup, IDLE_STATE);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    // The logo chosen in step 1 is uploaded once the profile exists.
    const logo = detailsForm.current ? new FormData(detailsForm.current).get("logo") : null;
    if (logo instanceof File && logo.size > 0) formData.set("logo", logo);
    React.startTransition(() => formAction(formData));
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">Confirm your email</h2>
        {email && (
          <p className="mt-1 text-sm break-words text-muted-foreground">
            Enter the code we sent to <span className="font-medium text-ink">{email}</span>.
          </p>
        )}
      </div>
      <SentBanner message={sentMessage} />
      <ErrorBanner message={startError ?? (state.status === "error" ? state.message : undefined)} />
      <input type="hidden" name="request_id" value={requestId} />
      <OtpField error={state.fieldErrors?.otp} />
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Verify and create profile
      </Button>
      <CodeStepLinks onResend={onResend} onEdit={onEdit} resending={resending} editLabel="Change details" />
    </form>
  );
}
