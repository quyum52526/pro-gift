import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getVendorSession } from "@/lib/vendor/session";
import { signOutVendor } from "./actions";

// Vendor profiles are private: never indexed, never in the sitemap, and robots.txt disallows /vendor.
export const metadata: Metadata = {
  title: { default: "Vendor portal", template: "%s | Pro Gift Vendor" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function VendorLayout({ children }: LayoutProps<"/vendor">) {
  return (
    <div className="flex flex-1 flex-col bg-surface-tint/40">
      <div className="border-b bg-ink text-surface">
        <div className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between px-4 md:px-8">
          <Link href="/vendor" className="flex items-center gap-2 text-sm font-semibold">
            <span className="h-2 w-2 rounded-full bg-gold" aria-hidden />
            Pro Gift Vendor Portal
          </Link>
          <Suspense fallback={null}>
            <SignedInActions />
          </Suspense>
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">{children}</div>
    </div>
  );
}

async function SignedInActions() {
  const session = await getVendorSession();
  if (!session) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="hidden max-w-[16rem] truncate text-xs text-surface/70 sm:inline">
        {session.vendor.businessName}
      </span>
      <form action={signOutVendor}>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="h-8 text-surface/80 hover:bg-surface/10 hover:text-surface"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </form>
    </div>
  );
}
