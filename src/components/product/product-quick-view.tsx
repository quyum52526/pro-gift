"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, Clock, Package, Rotate3d } from "lucide-react";

import { cn, formatPriceRange } from "@/lib/utils";
import { buildQuickInquiryUrl } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Product } from "@/types/product";
import { LogoMockupPanel } from "./logo-mockup-panel";
import { ProductGallery } from "./product-gallery";
import { WhatsAppIcon } from "./whatsapp-icon";
import type { LogoMockupState } from "./types";

type VideoSource = { kind: "youtube"; src: string } | { kind: "file"; src: string };

const YOUTUBE_ID = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{11})/;

function resolveVideo(url: string | undefined): VideoSource | null {
  if (!url) return null;
  const id = url.match(YOUTUBE_ID)?.[1];
  if (id) return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}?rel=0` };
  return { kind: "file", src: url };
}

/** Small uppercase label shared by every quick-view section. */
function SectionLabel({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

/** Body of the product quick view; mounted only while the dialog is open. */
export function ProductQuickView({ product }: { product: Product }) {
  const [imageIndex, setImageIndex] = React.useState(0);
  const [logo, setLogo] = React.useState<LogoMockupState | null>(null);
  const video = resolveVideo(product.videoUrl);
  const galleryImages = product.images.slice(0, 4);
  // With three photos the first one spans both rows, so the tiles still fill a 2×2 block.
  const featureFirst = galleryImages.length === 3;
  const leadTime = product.specs.find((spec) => spec.label === "Lead time")?.value;

  const selectLogo = (next: LogoMockupState | null) => {
    setLogo(next);
    if (next && !logo && !product.images[imageIndex]?.printArea) {
      const firstPrintable = product.images.findIndex((img) => img.printArea);
      if (firstPrintable >= 0) setImageIndex(firstPrintable);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header strip; also keeps content clear of the dialog's close button */}
      <div className="flex h-7 items-center gap-2 pr-12">
        <Rotate3d className="h-4 w-4 text-gold-deep" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Quick view
        </span>
      </div>

      {/*
        lg+: two equal columns, two rows.
          Row 1: media           | details & specs
          Row 2: logo controls   | pricing & actions  (sized to content)
        Below lg: one column, with the logo controls right after the media they drive.
      */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-x-8">
        {/* Row 1 · left: mockup + video/gallery */}
        <section
          aria-label="Product media"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-start-1 lg:row-start-1 lg:self-start"
        >
          <ProductGallery
            images={product.images}
            productName={product.name}
            currentIndex={imageIndex}
            onIndexChange={setImageIndex}
            logo={logo}
            showThumbnails={false}
          />

          {/*
            Video + gallery. From sm up the inner stack is absolutely positioned, so it
            adds no height of its own and stretches to exactly match the mockup image.
          */}
          <div className="relative">
            <div className="flex flex-col gap-3 sm:absolute sm:inset-0">
              <div
                role="region"
                aria-label="360° view"
                className="relative aspect-video shrink-0 overflow-hidden rounded-xl border bg-ink"
              >
                {video?.kind === "youtube" && (
                  <iframe
                    src={video.src}
                    title={`${product.name} 360° video`}
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="absolute inset-0 h-full w-full"
                  />
                )}
                {video?.kind === "file" && (
                  <video
                    src={video.src}
                    controls
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                {!video && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4 text-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15">
                      <Rotate3d className="h-5 w-5 text-gold" aria-hidden />
                    </span>
                    <p className="text-sm font-medium text-surface">360° view coming soon</p>
                    <p className="text-xs text-surface/60">Ask us on WhatsApp for a live video.</p>
                  </div>
                )}
              </div>

              <div
                role="group"
                aria-label="Product photos"
                className={cn(
                  "grid grid-cols-3 gap-2 sm:min-h-0 sm:flex-1 sm:grid-cols-2 sm:gap-3",
                  galleryImages.length > 2 ? "sm:grid-rows-2" : "sm:grid-rows-1",
                )}
              >
                {galleryImages.map((image, index) => (
                  <button
                    key={image.src}
                    type="button"
                    onClick={() => setImageIndex(index)}
                    aria-label={`Show photo ${index + 1}: ${image.alt}`}
                    aria-current={imageIndex === index}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-xl border-2 bg-surface-tint transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:aspect-auto sm:min-h-0",
                      featureFirst && index === 0 && "sm:row-span-2",
                      imageIndex === index
                        ? "border-teal"
                        : "border-transparent opacity-80 hover:opacity-100",
                    )}
                  >
                    <Image
                      src={image.src}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 160px, 33vw"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Row 2 · left (first after media on mobile): logo upload & controls */}
        {/* Grid wrapper so the panel stretches to the pricing box's height */}
        <div className="grid lg:col-start-1 lg:row-start-2">
          <LogoMockupPanel
            logo={logo}
            onChange={selectLogo}
            canPreviewCurrent={Boolean(product.images[imageIndex]?.printArea)}
            compact
          />
        </div>

        {/* Row 1 · right: details & specs */}
        <section className="flex min-w-0 flex-col gap-5 lg:col-start-2 lg:row-start-1">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{product.category.name}</Badge>
              <Badge variant="outline" className="font-mono tracking-wide">
                {product.code}
              </Badge>
            </div>
            <DialogTitle className="mt-3 text-2xl font-bold leading-tight text-ink">
              {product.name}
            </DialogTitle>
            <DialogDescription className="mt-1.5 leading-relaxed">
              {product.shortDescription}
            </DialogDescription>
          </div>

          <div>
            <SectionLabel>Specifications</SectionLabel>
            <dl className="mt-2 divide-y overflow-hidden rounded-xl border">
              {product.specs.map((spec, index) => (
                <div
                  key={spec.label}
                  className={cn(
                    "grid grid-cols-[2fr_3fr] gap-3 px-3.5 py-2.5 text-sm",
                    index % 2 === 0 && "bg-surface-tint/50",
                  )}
                >
                  <dt className="text-muted-foreground">{spec.label}</dt>
                  <dd className="font-medium text-ink">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <SectionLabel>Branding options</SectionLabel>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {product.brandingMethods.map((method) => (
                <li key={method}>
                  <Badge variant="gold">{method}</Badge>
                </li>
              ))}
            </ul>
          </div>

          <details className="group rounded-xl border px-3.5 py-2.5 open:bg-surface-tint/40">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
              About this product
              <ChevronDown
                className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </details>
        </section>

        {/* Row 2 · right: pricing & actions */}
        <aside
          aria-label="Pricing and inquiry"
          className="flex flex-col justify-between gap-4 rounded-xl border bg-surface-tint p-4 lg:col-start-2 lg:row-start-2"
        >
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Price per piece</p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight text-teal">
                {formatPriceRange(product.priceRange.min, product.priceRange.max)}
              </p>
            </div>
            <dl className="flex gap-2 text-xs">
              <div className="rounded-lg bg-surface px-2.5 py-1.5">
                <dt className="flex items-center gap-1 text-muted-foreground">
                  <Package className="h-3 w-3 text-gold-deep" aria-hidden />
                  MOQ
                </dt>
                <dd className="font-semibold text-ink">{product.moq} pcs</dd>
              </div>
              {leadTime && (
                <div className="rounded-lg bg-surface px-2.5 py-1.5">
                  <dt className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3 text-gold-deep" aria-hidden />
                    Lead time
                  </dt>
                  <dd className="font-semibold text-ink">{leadTime}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="whatsapp" className="h-11 flex-1">
              <a href={buildQuickInquiryUrl(product)} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="h-5 w-5" />
                WhatsApp inquiry
              </a>
            </Button>
            <Button asChild variant="outline" className="h-11 flex-1 bg-surface">
              <Link href={`/products/${product.slug}`}>
                View full details <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <p className="text-[11px] leading-snug text-muted-foreground">
            Final price depends on quantity, branding and packaging.
          </p>
        </aside>
      </div>
    </div>
  );
}
