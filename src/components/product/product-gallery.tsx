"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types/product";
import { PRINT_STYLE_FILTERS, type LogoMockupState } from "./types";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  logo: LogoMockupState | null;
  /** Hide the thumbnail strip when the parent renders its own image picker. */
  showThumbnails?: boolean;
  /** Square, tighter frame for narrow columns such as the quick view. */
  compact?: boolean;
}

export function ProductGallery({
  images,
  productName,
  currentIndex,
  onIndexChange,
  logo,
  showThumbnails = true,
  compact = false,
}: ProductGalleryProps) {
  const current = images[currentIndex];
  const total = images.length;
  const showMockup = Boolean(logo && current.printArea);

  const go = (delta: number) => onIndexChange((currentIndex + delta + total) % total);

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          "relative w-full overflow-hidden border bg-surface-tint",
          compact ? "aspect-square rounded-xl" : "aspect-[4/5] rounded-2xl",
        )}
        role="group"
        aria-roledescription="carousel"
        aria-label={`${productName} images`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0"
          >
            <Image
              src={current.src}
              alt={current.alt}
              fill
              loading={currentIndex === 0 ? "eager" : "lazy"}
              fetchPriority={currentIndex === 0 ? "high" : "auto"}
              sizes={compact ? "(min-width: 1024px) 25vw, 100vw" : "(min-width: 1024px) 50vw, 100vw"}
              className="object-cover"
            />

            {showMockup && logo && current.printArea && (
              <div
                className="pointer-events-none absolute flex items-center justify-center"
                style={{
                  left: `${current.printArea.x}%`,
                  top: `${current.printArea.y}%`,
                  width: `${current.printArea.width}%`,
                  height: `${current.printArea.height}%`,
                }}
              >
                {/* Blob URLs can't go through next/image, so a plain img is used here. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.url}
                  alt="Your logo mockup"
                  className="max-h-full max-w-full object-contain"
                  style={{
                    width: `${logo.scale}%`,
                    height: `${logo.scale}%`,
                    transform: `translate(${logo.offsetX}%, ${logo.offsetY}%)`,
                    filter: PRINT_STYLE_FILTERS[logo.style],
                    opacity: logo.style === "engraved" ? 0.75 : 1,
                  }}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {showMockup && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1 text-xs font-medium text-surface backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-gold" aria-hidden />
            Live logo preview
          </span>
        )}

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 rounded-full bg-surface/90 text-ink shadow-card transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                compact ? "left-2 p-1.5" : "left-3 p-2",
              )}
              aria-label="Previous image"
            >
              <ChevronLeft className={compact ? "h-4 w-4" : "h-5 w-5"} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 rounded-full bg-surface/90 text-ink shadow-card transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                compact ? "right-2 p-1.5" : "right-3 p-2",
              )}
              aria-label="Next image"
            >
              <ChevronRight className={compact ? "h-4 w-4" : "h-5 w-5"} />
            </button>
          </>
        )}
      </div>

      {showThumbnails && total > 1 && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => onIndexChange(index)}
              aria-label={`View image ${index + 1} of ${total}`}
              aria-current={currentIndex === index}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border-2 bg-surface-tint transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                currentIndex === index
                  ? "border-teal"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <Image src={image.src} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
