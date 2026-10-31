import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";

import { getCategories } from "@/data/products";
import { buildGeneralWhatsAppUrl } from "@/lib/whatsapp";
import { CategoryTabs, CategoryTabsFallback } from "./category-tabs";
import { HeaderHeight } from "./header-height";

// Layout from the Claude Design canvas "Pro Gift — 3D Header, Hero & Footer".
export async function SiteHeader() {
  // The header is on every page, admin included, so a catalogue outage only drops the category tabs.
  const categories = await getCategories().catch((error: unknown) => {
    console.error("[SiteHeader] Could not load categories:", error);
    return [];
  });

  return (
    // Sticky with a teal-tinted frosted ground, so it reads apart from the white hero and keeps
    // content legible as it scrolls underneath.
    <header
      id="top"
      className="sticky top-0 z-50 border-b border-hairline bg-surface-tint/90 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-surface-tint/75"
    >
      <HeaderHeight />
      {/* Gold accent rule with a travelling light reflection */}
      <div className="pg-bar" aria-hidden />
      <div className="pg-head-in">
        <div className="mx-auto flex min-h-[72px] max-w-[1200px] items-center justify-between gap-4 px-4 sm:min-h-[88px] sm:px-6">
          <Link href="/" aria-label="Pro Gift, Corporate Gift Shop. Home" className="pg-logo">
            <Image
              src="/brand/logo-wordmark.svg"
              alt="Pro Gift Corporate Gift Shop"
              width={869}
              height={194}
              priority
              className="block h-10 w-auto sm:h-12"
            />
          </Link>
          <div className="flex shrink-0 items-center gap-3">
            {/* No room beside the logo on phones; the home page band links here instead. */}
            <Link href="/gift-box" className="pg-btn pg-btn-line hidden md:inline-flex">
              Build a gift box
            </Link>
            <a
              href={buildGeneralWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="pg-btn pg-btn-teal px-4 sm:px-[26px]"
            >
              Talk to us
            </a>
          </div>
        </div>
        {categories.length > 0 && (
          <Suspense fallback={<CategoryTabsFallback categories={categories} />}>
            <CategoryTabs categories={categories} />
          </Suspense>
        )}
      </div>
    </header>
  );
}
