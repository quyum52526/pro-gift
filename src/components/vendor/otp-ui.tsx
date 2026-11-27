"use client";

import * as React from "react";
import { Loader2, MailCheck } from "lucide-react";

import { Field, controlClass, errorProps } from "@/components/admin/field";
import { IDLE_OTP_STATE, type OtpStartState } from "@/lib/vendor/otp-state";

// Shared pieces of the email-code (OTP) forms: enlisting, forgot password and change password.

export function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {message}
    </p>
  );
}

export function SentBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="status" className="flex gap-2 rounded-lg border border-teal/30 bg-surface-tint px-3 py-2 text-sm text-ink">
      <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
      {message}
    </p>
  );
}

export function OtpField({ error }: { error?: string }) {
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
export function useOtpStart(action: (prev: OtpStartState, formData: FormData) => Promise<OtpStartState>) {
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

export function CodeStepLinks({
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
