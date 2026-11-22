import Image from "next/image";
import { Mail, MapPin, Store } from "lucide-react";

import { WhatsAppIcon } from "@/components/product/whatsapp-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { VendorProfile } from "@/lib/vendor/types";
import { buildVendorContactUrl, formatWhatsAppNumber } from "@/lib/vendor/whatsapp";

interface VendorProfileHeaderProps {
  vendor: VendorProfile;
  productCount: number;
  /** Extra buttons, e.g. "Edit profile" in the portal or "Disable" in admin. */
  actions?: React.ReactNode;
  /** Show the "Chat on WhatsApp" button (admin view). */
  showContact?: boolean;
}

/** Top of a vendor page: logo, business name, WhatsApp (sign-in ID), email, address and contact. */
export function VendorProfileHeader({ vendor, productCount, actions, showContact }: VendorProfileHeaderProps) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-surface shadow-card">
      <div className="h-2 bg-gradient-to-r from-teal via-gold to-teal" aria-hidden />
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start md:p-6">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-surface-tint">
          {vendor.logoUrl ? (
            <Image
              src={vendor.logoUrl}
              alt={`${vendor.businessName} logo`}
              fill
              sizes="96px"
              className="object-contain p-1.5"
            />
          ) : (
            <Store className="h-10 w-10 text-teal" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight break-words text-ink">{vendor.businessName}</h1>
            {!vendor.isActive && <Badge variant="outline">Disabled</Badge>}
          </div>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <WhatsAppIcon className="h-3.5 w-3.5 text-whatsapp" />
              <span className="font-medium text-ink">{formatWhatsAppNumber(vendor.whatsapp)}</span>
            </span>
            {vendor.email && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <Mail className="h-3.5 w-3.5 shrink-0 text-teal" aria-hidden />
                <span className="break-all">{vendor.email}</span>
                {!vendor.emailVerified && <span className="text-xs">(not confirmed)</span>}
              </span>
            )}
            <span>
              {productCount} {productCount === 1 ? "product" : "products"}
            </span>
            <span>
              Ref <span className="font-mono">{vendor.code}</span>
            </span>
          </p>
          {vendor.address && (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-ink">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" aria-hidden />
              <span className="break-words">{vendor.address}</span>
            </p>
          )}
          {vendor.description && (
            <p className="mt-3 max-w-3xl text-sm whitespace-pre-line text-muted-foreground">{vendor.description}</p>
          )}
        </div>

        {(actions || showContact) && (
          <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
            {showContact && (
              <Button asChild variant="whatsapp" size="sm">
                <a href={buildVendorContactUrl(vendor)} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="h-4 w-4" /> Chat on WhatsApp
                </a>
              </Button>
            )}
            {actions}
          </div>
        )}
      </div>
    </section>
  );
}
