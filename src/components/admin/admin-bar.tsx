import { Suspense } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";

import { signOut } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/button";
import { AdminNav, AdminNavLinks } from "./admin-nav";

/** Dark top bar shared by every signed-in admin section. */
export function AdminBar() {
  return (
    <div className="border-b bg-ink text-surface">
      <div className="mx-auto flex min-h-12 w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/admin/products" className="flex shrink-0 items-center gap-2 py-3 text-sm font-semibold">
            <span className="h-2 w-2 rounded-full bg-gold" aria-hidden />
            <span className="hidden sm:inline">Pro Gift Admin</span>
          </Link>
          <Suspense fallback={<AdminNavLinks />}>
            <AdminNav />
          </Suspense>
        </div>
        <form action={signOut}>
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
    </div>
  );
}
