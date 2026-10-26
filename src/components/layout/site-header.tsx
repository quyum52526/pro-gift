import Link from "next/link";

import { buildGeneralWhatsAppUrl } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/product/whatsapp-icon";
import { BrandLogo } from "./brand-logo";

const NAV_LINKS = [{ label: "All gifts", href: "/" }] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
      {/* Gold accent rule from the brand palette */}
      <div className="h-1 bg-gradient-to-r from-gold-deep via-gold to-gold-deep" aria-hidden />
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 md:px-8">
        <BrandLogo priority />

        <div className="flex items-center gap-2 sm:gap-6">
          <nav aria-label="Main" className="hidden sm:block">
            <ul className="flex items-center gap-6">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-ink transition-colors hover:text-teal"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Button asChild variant="default" size="sm" className="h-10">
            <a href={buildGeneralWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Talk to us</span>
              <span className="sr-only sm:hidden">Chat with Pro Gift on WhatsApp</span>
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
