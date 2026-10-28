"use client";

import Image from "next/image";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { formatPriceRange } from "@/lib/utils";
import { buildQuickInquiryUrl } from "@/lib/whatsapp";
import type { Product } from "@/types/product";
import { ProductQuickView } from "./product-quick-view";
import { WhatsAppIcon } from "./whatsapp-icon";

export function ProductCard({ product }: { product: Product }) {
  const cover = product.images[0];
  return (
    <Dialog>
      <article className="group flex flex-col overflow-hidden rounded-2xl border bg-surface transition hover:shadow-card">
        {/* The WhatsApp link sits outside this trigger: interactive elements can't nest. */}
        <DialogTrigger asChild>
          <button
            type="button"
            aria-label={`Quick view: ${product.name}`}
            className="block w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <div className="relative aspect-square overflow-hidden bg-surface-tint">
              <Image
                src={cover.src}
                alt={cover.alt}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-x-3 bottom-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-ink/80 py-1.5 text-xs font-medium text-surface opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus-within:opacity-100">
                <Eye className="h-3.5 w-3.5 text-gold" aria-hidden />
                Quick view
              </span>
            </div>
            <div className="px-4 pt-4">
              <p className="font-mono text-xs text-muted-foreground">{product.code}</p>
              <h3 className="mt-1 line-clamp-1 font-semibold text-ink">{product.name}</h3>
              <p className="mt-1 text-sm font-medium text-teal">
                {formatPriceRange(product.priceRange.min, product.priceRange.max)}
              </p>
            </div>
          </button>
        </DialogTrigger>
        <div className="mt-auto p-4 pt-3">
          <Button asChild variant="whatsapp" size="sm" className="w-full">
            <a
              href={buildQuickInquiryUrl(product)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ask about ${product.name} on WhatsApp`}
            >
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp inquiry
            </a>
          </Button>
        </div>
      </article>

      <DialogContent className="p-4 sm:max-w-7xl md:p-6">
        <ProductQuickView product={product} />
      </DialogContent>
    </Dialog>
  );
}
