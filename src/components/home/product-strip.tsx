import Image from "next/image";

import type { Product } from "@/types/product";

// Layout from the Claude Design canvas "Pro Gift — 3D Header, Hero & Footer", as compact image thumbnails.
/** Items per half of the loop: 24 × 120px ≈ 2880px, wider than a 2560px screen, so no gap shows. */
const MIN_ITEMS = 24;

function StripThumb({ product, hidden = false }: { product: Product; hidden?: boolean }) {
  const cover = product.images[0];
  if (!cover) return null;
  return (
    // Jumps to the catalogue below; html's smooth scroll-behavior animates it (globals.css).
    <a
      href="#catalog"
      className="pg-pitem"
      {...(hidden ? { tabIndex: -1, "aria-hidden": true } : { "aria-label": `${product.name}: browse the catalogue` })}
    >
      <span className="pg-pimg relative block overflow-hidden">
        {/* Zoomed in to trim the empty backdrop; the box clips the rest, and the product stays whole. */}
        <Image src={cover.src} alt="" fill sizes="128px" className="origin-[50%_32%] scale-[1.15] object-cover" />
      </span>
    </a>
  );
}

/** Product images scrolling right to left; pauses on hover or focus. The second half repeats the first so the loop is seamless. */
export function ProductStrip({ products }: { products: Product[] }) {
  const withImages = products.filter((product) => product.images.length > 0);
  if (withImages.length === 0) return null;

  const repeats = Math.ceil(MIN_ITEMS / withImages.length);
  const items = Array.from({ length: repeats }, () => withImages).flat();

  return (
    <section aria-label="Gift products" className="overflow-hidden bg-surface-tint py-8">
      <div className="[mask-image:linear-gradient(90deg,transparent_0,#000_6%,#000_94%,transparent_100%)]">
        {/* Vertical padding leaves room for the hover lift. */}
        <div className="pg-pstrip py-2">
          <div className="flex gap-4 pr-4">
            {items.map((product, index) => (
              <StripThumb key={`${product.slug}-${index}`} product={product} hidden={index >= withImages.length} />
            ))}
          </div>
          <div className="flex gap-4 pr-4" aria-hidden>
            {items.map((product, index) => (
              <StripThumb key={`${product.slug}-${index}`} product={product} hidden />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
