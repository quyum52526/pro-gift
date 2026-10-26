"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { signIn } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/button";
import { IDLE_STATE } from "@/lib/admin/form-state";
import { Field, controlClass } from "./field";

export function LoginForm() {
  const [state, formAction, pending] = React.useActionState(signIn, IDLE_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.status === "error" && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.message}
        </p>
      )}
      <Field label="Email" htmlFor="email">
        <input id="email" name="email" type="email" autoComplete="email" required className={controlClass} />
      </Field>
      <Field label="Password" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={controlClass}
        />
      </Field>
      <Button type="submit" disabled={pending} className="mt-1">
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Sign in
      </Button>
    </form>
  );
}
