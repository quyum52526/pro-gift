"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { categoryHref } from "@/lib/catalog/category-filter";
import { cn } from "@/lib/utils";
import type { ProductCategory } from "@/types/product";

interface CategoryTabsViewProps {
  categories: ProductCategory[];
  /** Selected slug (`undefined` = All Gifts); `null` marks no tab while the URL is unknown or off the catalogue. */
  activeSlug: string | undefined | null;
}

function CategoryTabsView({ categories, activeSlug }: CategoryTabsViewProps) {
  const tabs = [{ name: "All Gifts", slug: undefined }, ...categories];
  return (
    // One swipeable row on phones keeps the sticky header short; it wraps from md up.
    <nav
      aria-label="Gift categories"
      className="mx-auto flex max-w-[1200px] gap-2 overflow-x-auto px-4 pt-1 pb-3 [scrollbar-width:none] sm:px-6 md:flex-wrap md:overflow-visible md:pt-0 md:pb-4 [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map(({ name, slug }, index) => {
        const href = categoryHref(slug);
        const active = activeSlug !== null && activeSlug === slug;
        return (
          <Link
            key={slug ?? "all"}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn("pg-roll shrink-0", active && "pg-roll-on")}
            style={{ animationDelay: `${0.3 + index * 0.06}s` }}
          >
            <span className="pg-roll-in">
              <span className="pg-rf pg-rf-a">{name}</span>
              <span className="pg-rf pg-rf-b" aria-hidden>
                {name}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Category pills; the tab for the current page is marked. Needs a <Suspense> boundary (reads the pathname). */
export function CategoryTabs({ categories }: { categories: ProductCategory[] }) {
  const pathname = usePathname();
  // "/" is All Gifts; /category/<slug> marks that tab; any other page marks none.
  const current = pathname === "/" ? undefined : categories.find((c) => categoryHref(c.slug) === pathname)?.slug;
  const onCatalogue = pathname === "/" || current !== undefined;
  return <CategoryTabsView categories={categories} activeSlug={onCatalogue ? current : null} />;
}

export function CategoryTabsFallback({ categories }: { categories: ProductCategory[] }) {
  return <CategoryTabsView categories={categories} activeSlug={null} />;
}
