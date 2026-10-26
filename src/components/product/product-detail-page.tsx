"use client";

// Adapted from the 21st.dev "Product Detail Page" component (kavikatiyar):
// fixed price/cart/seller swapped for price range, logo mockup and WhatsApp inquiry.

import * as React from "react";
import Link from "next/link";
import {
  BadgeCheck,
  ChevronRight,
  Leaf,
  Minus,
  Package,
  Palette,
  Plus,
  Ruler,
  Share2,
  Sparkles,
  Tag,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { cn, formatPriceRange } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BreadcrumbItem, Product, ProductTagIcon } from "@/types/product";
import { ProductGallery } from "./product-gallery";
import { LogoMockupPanel } from "./logo-mockup-panel";
import { WhatsAppIcon } from "./whatsapp-icon";
import type { LogoMockupState } from "./types";

const TAG_ICONS: Record<ProductTagIcon, LucideIcon> = {
  tag: Tag,
  palette: Palette,
  package: Package,
  sparkles: Sparkles,
  ruler: Ruler,
  leaf: Leaf,
};

const ASSURANCES = [
  { icon: BadgeCheck, title: "Free logo mockup", text: "Approve the design before production" },
  { icon: Truck, title: "Nationwide delivery", text: "Dhaka, Chattogram and all districts" },
  { icon: Package, title: "Gift-ready packing", text: "Branded boxes and sleeves on request" },
] as const;

export interface ProductDetailPageProps {
  product: Product;
  breadcrumbs: BreadcrumbItem[];
  /** Absolute URL of this page, included in the WhatsApp message. */
  productUrl?: string;
}

export function ProductDetailPage({ product, breadcrumbs, productUrl }: ProductDetailPageProps) {
  const [imageIndex, setImageIndex] = React.useState(0);
  const [logo, setLogo] = React.useState<LogoMockupState | null>(null);
  const [quantity, setQuantity] = React.useState(product.moq);

  const priceLabel = formatPriceRange(product.priceRange.min, product.priceRange.max);
  const whatsappUrl = buildWhatsAppUrl(product, {
    quantity,
    productUrl,
    withLogo: Boolean(logo),
  });

  const selectLogo = (next: LogoMockupState | null) => {
    setLogo(next);
    // Jump to a view that can show the mockup when a logo is first added.
    if (next && !logo && !product.images[imageIndex]?.printArea) {
      const firstPrintable = product.images.findIndex((img) => img.printArea);
      if (firstPrintable >= 0) setImageIndex(firstPrintable);
    }
  };

  const share = async () => {
    const url = productUrl ?? window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product.name, url }).catch(() => undefined);
    } else {
      await navigator.clipboard?.writeText(url);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex items-center text-sm text-muted-foreground">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li key={item.label} className={cn("flex items-center", isLast && "min-w-0")}>
                  {item.href && !isLast ? (
                    <Link href={item.href} className="transition-colors hover:text-teal">
                      {item.label}
                    </Link>
                  ) : (
                    <span aria-current={isLast ? "page" : undefined} className="truncate text-ink">
                      {item.label}
                    </span>
                  )}
                  {!isLast && <ChevronRight className="mx-1 h-4 w-4 shrink-0" aria-hidden />}
                </li>
              );
            })}
          </ol>
        </nav>
        <Button variant="ghost" size="icon" onClick={share} className="shrink-0">
          <Share2 className="h-5 w-5" />
          <span className="sr-only">Share product</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery + logo mockup */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
          <ProductGallery
            images={product.images}
            productName={product.name}
            currentIndex={imageIndex}
            onIndexChange={setImageIndex}
            logo={logo}
          />
          <LogoMockupPanel
            logo={logo}
            onChange={selectLogo}
            canPreviewCurrent={Boolean(product.images[imageIndex]?.printArea)}
          />
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{product.category.name}</Badge>
            <Badge variant="outline" className="font-mono tracking-wide">
              {product.code}
            </Badge>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-muted-foreground">{product.shortDescription}</p>

          <div className="mt-6 rounded-2xl border bg-surface p-5 shadow-card">
            <p className="text-sm font-medium text-muted-foreground">Price range per piece</p>
            <p className="mt-1 text-3xl font-bold text-teal md:text-4xl">{priceLabel}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Final price depends on quantity, branding method and packaging.
            </p>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
              <QuantityStepper value={quantity} min={product.moq} onChange={setQuantity} />
              <Button asChild variant="whatsapp" size="lg" className="flex-1">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="h-5 w-5" />
                  Get quote on WhatsApp
                </a>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Minimum order {product.moq} pcs · We usually reply within 30 minutes (10am–8pm).
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {product.tags.map((tag) => {
              const Icon = tag.icon ? TAG_ICONS[tag.icon] : null;
              return (
                <Badge key={tag.label} variant="secondary" className="gap-2 px-3 py-1 text-sm font-normal">
                  {Icon && <Icon className="h-4 w-4 text-teal" aria-hidden />}
                  {tag.label}
                </Badge>
              );
            })}
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-ink">About this product</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{product.description}</p>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-ink">Branding options</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {product.brandingMethods.map((method) => (
                <li key={method}>
                  <Badge variant="gold" className="px-3 py-1 text-sm">
                    {method}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-ink">Specifications</h2>
            <dl className="mt-3 divide-y rounded-2xl border">
              {product.specs.map((spec) => (
                <div key={spec.label} className="grid grid-cols-2 gap-4 px-4 py-3 text-sm">
                  <dt className="text-muted-foreground">{spec.label}</dt>
                  <dd className="font-medium text-ink">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <ul className="mt-8 grid gap-3 border-t pt-6 sm:grid-cols-3">
            {ASSURANCES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3 sm:flex-col sm:gap-2">
                <Icon className="h-6 w-6 shrink-0 text-gold-deep" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-ink">{title}</p>
                  <p className="text-xs text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Mobile sticky inquiry bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">{product.code}</p>
            <p className="truncate text-sm font-semibold text-teal">{priceLabel}</p>
          </div>
          <Button asChild variant="whatsapp" className="h-11">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="h-5 w-5" />
              Get quote
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

interface QuantityStepperProps {
  value: number;
  min: number;
  onChange: (value: number) => void;
}

function QuantityStepper({ value, min, onChange }: QuantityStepperProps) {
  const id = React.useId();
  const step = min >= 50 ? 25 : 10;
  const clamp = (n: number) => (Number.isFinite(n) ? Math.max(min, Math.round(n)) : min);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        Quantity (pcs)
      </label>
      <div className="flex h-12 items-center rounded-lg border bg-surface">
        <button
          type="button"
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
          className="flex h-full w-11 items-center justify-center text-ink disabled:opacity-40"
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          value={value}
          // Allow free typing; the value is clamped to the minimum on blur.
          onChange={(e) => onChange(Math.max(0, Math.round(Number(e.target.value)) || 0))}
          onBlur={(e) => onChange(clamp(Number(e.target.value)))}
          className="h-full w-20 border-x bg-transparent text-center font-medium tabular-nums text-ink focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange(clamp(value + step))}
          className="flex h-full w-11 items-center justify-center text-ink"
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
