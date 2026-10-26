import type { Metadata } from "next";

import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <div className="mx-auto w-full max-w-sm px-4 py-16">
      <div className="rounded-xl border bg-surface p-6 shadow-card">
        <h1 className="text-xl font-bold text-ink">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage Pro Gift products and prices.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
