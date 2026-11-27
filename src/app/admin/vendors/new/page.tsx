import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { FormSkeleton } from "@/components/admin/form-page";
import { VendorCreateForm } from "@/components/admin/vendor-create-form";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Create vendor" };

export default function NewVendorPage() {
  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/vendors"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-teal"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> All vendors
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">Create vendor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Adds the vendor straight away, with no email code. They sign in at /vendor with their WhatsApp number and
          this password.
        </p>
      </div>
      <Suspense fallback={<FormSkeleton />}>
        <AdminOnlyForm />
      </Suspense>
    </>
  );
}

async function AdminOnlyForm() {
  await requireAdmin();
  return <VendorCreateForm />;
}
