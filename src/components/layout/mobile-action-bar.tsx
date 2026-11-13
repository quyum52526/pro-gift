"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift } from "lucide-react";

import { WhatsAppIcon } from "@/components/product/whatsapp-icon";
import { buildGeneralWhatsAppUrl } from "@/lib/whatsapp";

// Bar height above the safe area: 1px border + 10px top + 48px button + 14px bottom (room for the 5px 3D edge).
const BAR_HEIGHT = "calc(73px + env(safe-area-inset-bottom))";

/**
 * Phone-only bottom bar with the two main actions. Needs a <Suspense> boundary (reads the pathname).
 * Renders an in-flow spacer after the footer so the fixed bar never covers page content.
 */
export function MobileActionBar() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;
  const onGiftBox = pathname === "/gift-box" || pathname.startsWith("/gift-box/");
  // Product pages have their own fixed, product-specific quote bar (product-detail-page.tsx).
  const hasOwnBar = pathname.startsWith("/products/");
  // The gift box flow is the bar's own destination and has its own WhatsApp actions.
  const hideBar = onGiftBox || hasOwnBar;
  // Reserve space only when some fixed bar is on screen, so it never covers the footer.
  const spacer = !hideBar || hasOwnBar;

  return (
    <>
      {spacer && <div aria-hidden className="shrink-0 md:hidden" style={{ height: BAR_HEIGHT }} />}
      {!hideBar && (
        <nav
          aria-label="Quick actions"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface-tint/95 px-4 pt-2.5 pb-[calc(14px+env(safe-area-inset-bottom))] shadow-[0_-6px_20px_-10px_rgb(29_29_29/0.25)] backdrop-blur-md md:hidden"
        >
          <div className="mx-auto grid max-w-[560px] grid-cols-2 gap-3">
            {/* Tighter gap, padding and tracking than .pg-btn so both labels fit side by side at 360px. */}
            <Link href="/gift-box" className="pg-btn pg-btn-line gap-1.5 px-2 tracking-[0.04em]">
              <Gift className="size-5 shrink-0" aria-hidden />
              Build Gift Box
            </Link>
            <a
              href={buildGeneralWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="pg-btn gap-1.5 bg-whatsapp px-2 tracking-[0.04em] text-surface shadow-[0_5px_0_var(--color-whatsapp-dark)] hover:shadow-[0_8px_0_var(--color-whatsapp-dark)]"
            >
              <WhatsAppIcon className="size-5 shrink-0" />
              WhatsApp Quote
            </a>
          </div>
        </nav>
      )}
    </>
  );
}
