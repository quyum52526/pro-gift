import Image from "next/image";
import Link from "next/link";
import { ImageOff, Store } from "lucide-react";

import { WhatsAppIcon } from "@/components/product/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { formatPriceRange } from "@/lib/utils";
import type { VendorProduct, VendorProfile } from "@/lib/vendor/types";
import { buildVendorWhatsAppUrl } from "@/lib/vendor/whatsapp";

interface VendorProductCardProps {
  product: VendorProduct;
  vendor: Pick<VendorProfile, "id" | "businessName" | "whatsapp" | "code" | "logoUrl">;
  /** Shows which vendor carries the product, linking to their admin page (search gallery). */
  showVendor?: boolean;
  /** Extra controls under the WhatsApp button, e.g. Edit / Delete in the vendor portal. */
  footer?: React.ReactNode;
}

/** Same frame as the storefront ProductCard, with details shown inline instead of a quick-view dialog. */
export function VendorProductCard({ product, vendor, showVendor, footer }: VendorProductCardProps) {
  const [cover, ...more] = product.images;
  return (
    <article
      id={`product-${product.id}`}
      className="group flex scroll-mt-32 flex-col overflow-hidden rounded-2xl border bg-surface transition hover:shadow-card target:ring-2 target:ring-gold"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-tint">
        {cover ? (
          <Image
            src={cover.src}
            alt={cover.alt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <ImageOff className="h-8 w-8" aria-hidden />
          </span>
        )}
        {more.length > 0 && (
          <span className="absolute right-3 bottom-3 rounded-full bg-ink/80 px-2 py-0.5 text-[11px] font-medium text-surface backdrop-blur">
            +{more.length} {more.length === 1 ? "photo" : "photos"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pt-4">
        {showVendor && (
          <Link
            href={`/admin/vendors/${vendor.id}`}
            className="mb-2 inline-flex items-center gap-2 self-start rounded-full border bg-surface-tint/60 py-0.5 pr-2.5 pl-0.5 text-xs font-medium text-ink transition hover:border-teal hover:text-teal"
          >
            <span className="relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-surface">
              {vendor.logoUrl ? (
                <Image src={vendor.logoUrl} alt="" fill sizes="20px" className="object-contain" />
              ) : (
                <Store className="h-3 w-3 text-teal" aria-hidden />
              )}
            </span>
            <span className="line-clamp-1">{vendor.businessName}</span>
          </Link>
        )}
        {product.code && <p className="font-mono text-xs text-muted-foreground">{product.code}</p>}
        <h3 className="mt-1 line-clamp-2 font-semibold text-ink">{product.name}</h3>
        <p className="mt-1 text-sm font-medium text-teal">
          {formatPriceRange(product.priceRange.min, product.priceRange.max)}
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">· MOQ {product.moq}</span>
        </p>
        {product.description && (
          <p className="mt-2 line-clamp-3 text-xs whitespace-pre-line text-muted-foreground">{product.description}</p>
        )}
        {product.specs.length > 0 && (
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs">
            {product.specs.slice(0, 4).map((spec) => (
              <div key={`${spec.label}-${spec.value}`} className="contents">
                <dt className="text-muted-foreground">{spec.label}</dt>
                <dd className="truncate text-ink">{spec.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2 p-4 pt-3">
        <Button asChild variant="whatsapp" size="sm" className="w-full">
          <a
            href={buildVendorWhatsAppUrl(vendor, product)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ask ${vendor.businessName} about ${product.name} on WhatsApp`}
          >
            <WhatsAppIcon className="h-4 w-4" />
            WhatsApp vendor
          </a>
        </Button>
        {footer}
      </div>
    </article>
  );
}

export function VendorProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{children}</div>;
}
