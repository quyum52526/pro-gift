import Link from "next/link";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "../login/actions";

export default function AdminProductsLayout({ children }: LayoutProps<"/admin/products">) {
  return (
    <>
      <div className="border-b bg-ink text-surface">
        <div className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between px-4 md:px-8">
          <Link href="/admin/products" className="flex items-center gap-2 text-sm font-semibold">
            <span className="h-2 w-2 rounded-full bg-gold" aria-hidden />
            Pro Gift Admin
          </Link>
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
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">{children}</div>
    </>
  );
}
