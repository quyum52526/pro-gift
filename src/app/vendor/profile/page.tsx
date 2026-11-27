import { Suspense } from "react";
import type { Metadata } from "next";

import { FormSkeleton } from "@/components/admin/form-page";
import { VendorFormHeader } from "@/components/vendor/vendor-form-header";
import { VendorPasswordForm, VendorProfileForm } from "@/components/vendor/vendor-profile-form";
import { requireVendor } from "@/lib/vendor/session";

export const metadata: Metadata = { title: "Edit profile" };

export default function VendorProfilePage() {
  return (
    <>
      <VendorFormHeader title="Edit profile" />
      <Suspense fallback={<FormSkeleton />}>
        <ProfileEditor />
      </Suspense>
    </>
  );
}

async function ProfileEditor() {
  const { vendor } = await requireVendor();
  return (
    <div className="flex flex-col gap-8">
      <VendorProfileForm vendor={vendor} />
      <VendorPasswordForm email={vendor.email} />
    </div>
  );
}
