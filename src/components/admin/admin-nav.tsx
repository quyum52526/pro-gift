"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const SECTIONS = [
  { label: "Products", href: "/admin/products" },
  { label: "Vendors", href: "/admin/vendors" },
  { label: "Pro Product Search", href: "/admin/vendors/search" },
];

/** The most specific section whose path the current URL starts with. */
function currentSection(pathname: string): string | undefined {
  return SECTIONS.map((section) => section.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
}

/** Highlights the current section. Reads the URL, so render it inside <Suspense>. */
export function AdminNav() {
  return <AdminNavLinks current={currentSection(usePathname())} />;
}

/** The links alone; also the Suspense fallback while the URL is unknown during prerender. */
export function AdminNavLinks({ current }: { current?: string }) {
  return (
    <nav aria-label="Admin" className="-mx-1 flex overflow-x-auto">
      {SECTIONS.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          aria-current={section.href === current ? "page" : undefined}
          className={cn(
            "rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap transition",
            section.href === current
              ? "bg-surface/15 font-medium text-surface"
              : "text-surface/70 hover:bg-surface/10 hover:text-surface",
          )}
        >
          {section.label}
        </Link>
      ))}
    </nav>
  );
}
