"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { categoryHref } from "@/lib/catalog/category-filter";
import type { ProductCategory } from "@/types/product";

const PAGES = [
  { name: "Blog", href: "/blog" },
  { name: "Contact", href: "/contact" },
  { name: "Build a Gift Box", href: "/gift-box" },
];

/**
 * Phone/tablet menu (below md). Radix Dialog supplies aria-expanded on the trigger, Escape to close,
 * focus trapping and focus return; each link is a DialogClose so a tap closes the sheet as it navigates.
 */
export function MobileMenu({ categories }: { categories: ProductCategory[] }) {
  return (
    <Dialog>
      <DialogTrigger className="pg-btn pg-btn-line w-12 shrink-0 px-0 md:hidden" aria-label="Open menu">
        <Menu className="size-5" aria-hidden />
      </DialogTrigger>
      <DialogContent
        aria-describedby={undefined}
        className="top-0 right-0 left-auto flex h-dvh max-h-dvh w-[min(340px,86vw)] translate-x-0 translate-y-0 flex-col gap-0 rounded-none rounded-l-2xl p-0 pb-[env(safe-area-inset-bottom)] starting:translate-x-full starting:scale-100 starting:opacity-100 md:hidden"
      >
        <DialogTitle className="border-b border-hairline px-6 py-5 text-xs font-semibold tracking-[0.08em] text-teal uppercase">
          Menu
        </DialogTitle>
        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col">
            {PAGES.map((page) => (
              <li key={page.href}>
                <DialogClose asChild>
                  <Link
                    href={page.href}
                    className="flex min-h-12 items-center rounded-lg px-3 text-base font-semibold text-ink transition-colors hover:bg-surface-tint hover:text-teal"
                  >
                    {page.name}
                  </Link>
                </DialogClose>
              </li>
            ))}
          </ul>
          {categories.length > 0 && (
            <>
              <h2 className="mt-5 px-3 pb-2 text-xs font-semibold tracking-[0.08em] text-teal uppercase">
                Gift categories
              </h2>
              <ul className="flex flex-col">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <DialogClose asChild>
                      <Link
                        href={categoryHref(category.slug)}
                        className="flex min-h-12 items-center rounded-lg px-3 text-[15px] font-medium text-ink transition-colors hover:bg-surface-tint hover:text-teal"
                      >
                        {category.name}
                      </Link>
                    </DialogClose>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
