"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { CATEGORY_PARAM, categoryHref, resolveCategorySlug } from "@/lib/catalog/category-filter";
import { scrollBehavior } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { ProductCategory } from "@/types/product";

interface CategoryTabsViewProps {
  categories: ProductCategory[];
  /** Selected slug (`undefined` = All Gifts); `null` marks no tab while the URL is unknown or off the catalogue. */
  activeSlug: string | undefined | null;
  onSelect?: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
}

function CategoryTabsView({ categories, activeSlug, onSelect }: CategoryTabsViewProps) {
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
            onClick={onSelect ? (event) => onSelect(event, href) : undefined}
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

/** Category pills synced with ?category=. Needs a <Suspense> boundary (reads search params). */
export function CategoryTabs({ categories }: { categories: ProductCategory[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isCatalogue = pathname === "/";

  // On the catalogue, filter in place: pushState updates useSearchParams without a server round trip.
  function handleSelect(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (!isCatalogue || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    window.history.pushState(null, "", href);
    // The grid sits below the hero; bring it into view so the filter visibly applies.
    // Deferred a tick: the router's own pushState handling would otherwise cancel the smooth scroll.
    window.setTimeout(() => {
      document.getElementById("catalog")?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
    }, 0);
  }

  return (
    <CategoryTabsView
      categories={categories}
      activeSlug={isCatalogue ? resolveCategorySlug(searchParams.get(CATEGORY_PARAM), categories) : null}
      onSelect={handleSelect}
    />
  );
}

export function CategoryTabsFallback({ categories }: { categories: ProductCategory[] }) {
  return <CategoryTabsView categories={categories} activeSlug={null} />;
}
