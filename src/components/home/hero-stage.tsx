"use client";

import { useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import Image from "next/image";

import { formatPriceRange } from "@/lib/utils";
import type { Product } from "@/types/product";

/**
 * Where the (up to three) floating product cards sit, in px from the 560px stage's edges.
 * Same spots as the design, pulled 16px inside the stage so they are never clipped.
 */
const CARD_SLOTS: { style: CSSProperties; delay: number }[] = [
  { style: { left: 16, top: 72 }, delay: 0 },
  { style: { right: 16, top: 212 }, delay: -1.4 },
  { style: { left: 16, top: 372 }, delay: -2.6 },
];

const FACE_SHADES = [0, 0.2, 0.34, 0.2] as const;
const SPARKS = [
  { x: -46, z: 30, delay: 0 },
  { x: 38, z: -26, delay: 0.12, teal: true },
  { x: 10, z: 52, delay: 0.24 },
  { x: -30, z: -44, delay: 0.1, teal: true },
  { x: 58, z: 20, delay: 0.3 },
  { x: -8, z: -8, delay: 0.18, teal: true },
] as const;

type Vars = CSSProperties & Record<`--${string}`, string>;

/** The design's line icons for the launch products; other products show their cover image. */
const THUMB_ICONS: Record<string, ReactNode> = {
  "executive-ceramic-mug": (
    <>
      <path d="M8 9h15v15a4 4 0 0 1-4 4h-7a4 4 0 0 1-4-4z" fill="#fff" stroke="var(--color-ink)" strokeWidth="2" />
      <path d="M23 12h2.5a3.5 3.5 0 0 1 0 8H23" fill="none" stroke="var(--color-ink)" strokeWidth="2" />
      <rect x="8" y="9" width="15" height="4" fill="var(--color-teal)" />
    </>
  ),
  "executive-leather-diary": (
    <>
      <rect x="7" y="3" width="20" height="28" rx="3" fill="var(--color-ink)" />
      <rect x="22" y="3" width="3" height="28" fill="var(--color-gold)" />
    </>
  ),
  "steel-vacuum-tumbler": (
    <>
      <rect x="12" y="2" width="10" height="5" rx="2" fill="var(--color-ink)" />
      <path d="M10 8h14l-2 22a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2z" fill="var(--color-teal)" />
    </>
  ),
};

function CardThumb({ product }: { product: Product }) {
  const icon = THUMB_ICONS[product.slug];
  const cover = product.images[0];
  return (
    <div className="relative flex h-[46px] w-[46px] flex-none items-center justify-center overflow-hidden rounded bg-surface-tint">
      {icon ? (
        <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
          {icon}
        </svg>
      ) : (
        cover && <Image src={cover.src} alt="" fill sizes="46px" className="object-cover" />
      )}
    </div>
  );
}

/** One box side: ink body, teal base and the gold ribbon swoosh from the logo mark. */
function BoxFace({ mirrored }: { mirrored: boolean }) {
  const curve = mirrored ? "M0 88C88 74 138 170 200 150" : "M0 150C62 170 112 74 200 88";
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden>
      <rect width="200" height="200" fill="var(--color-ink)" />
      <path d={`${curve}L200 200L0 200Z`} fill="var(--color-teal)" />
      <path d={curve} fill="none" stroke="var(--color-surface)" strokeWidth="30" />
      <path d={curve} fill="none" stroke="url(#pg-band)" strokeWidth="22" />
    </svg>
  );
}

function BowLoop() {
  return (
    <svg width="120" height="70" viewBox="0 0 120 70" aria-hidden>
      <path d="M60 62C46 8 4 4 8 40C10 62 46 66 60 62Z" fill="url(#pg-loop)" />
      <path d="M60 62C112 66 110 62 112 40C116 4 74 8 60 62Z" fill="url(#pg-loop)" />
      <path d="M55 56C45 22 20 18 18 38C18 52 42 58 55 56Z" fill="var(--color-gold-deep)" />
      <path d="M65 56C75 22 100 18 102 38C102 52 78 58 65 56Z" fill="var(--color-gold-deep)" />
    </svg>
  );
}

/** The 3D gift box with floating product cards; tilts toward the pointer. */
export function HeroStage({ products }: { products: Product[] }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const featured = products.slice(0, CARD_SLOTS.length);

  function handleMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    // Snap to 5% steps so a moving pointer doesn't re-render on every pixel.
    const snap = (value: number) => Math.round(Math.max(-0.5, Math.min(0.5, value)) * 20) / 20;
    const x = snap((event.clientX - rect.left) / rect.width - 0.5);
    const y = snap((event.clientY - rect.top) / rect.height - 0.5);
    setTilt((current) => (current.x === x && current.y === y ? current : { x, y }));
  }

  const label = featured.length
    ? `A 3D Pro Gift box sways while its lid lifts. Products float around it: ${featured.map((p) => p.name).join(", ")}.`
    : "A 3D Pro Gift box sways while its lid lifts.";

  return (
    <div
      className="flex min-w-0 flex-[1_1_480px] justify-center"
      onMouseMove={handleMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <div className="pg-stage" role="img" aria-label={label}>
        <svg width="0" height="0" className="absolute" aria-hidden>
          <defs>
            <linearGradient id="pg-band" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="var(--color-gold-deep)" />
              <stop offset=".5" stopColor="var(--color-gold)" />
              <stop offset="1" stopColor="var(--color-gold-deep)" />
            </linearGradient>
            <linearGradient id="pg-loop" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="var(--color-gold)" />
              <stop offset=".5" stopColor="var(--color-gold-deep)" />
              <stop offset="1" stopColor="var(--color-gold)" />
            </linearGradient>
          </defs>
        </svg>

        <div
          className="pg-world"
          style={{ transform: `rotateX(${(-18 - tilt.y * 14).toFixed(1)}deg) rotateY(${(tilt.x * 24).toFixed(1)}deg)` }}
        >
          <div className="pg-floor" />
          <div className="pg-glow" />
          <div className="pg-ring">
            <i className="top-[-8px] bg-gold" />
            <i className="top-[462px] bg-teal" />
          </div>

          <div className="pg-bob">
            <div className="pg-rig">
              <div className="pg-bfloor" />
              {FACE_SHADES.map((shade, side) => (
                <div
                  key={side}
                  className="pg-bf"
                  style={{ transform: `rotateY(${side * 90}deg) translateZ(100px)` }}
                >
                  <BoxFace mirrored={side % 2 === 1} />
                  {shade > 0 && <div className="pg-bshade" style={{ background: `rgb(0 0 0 / ${shade})` }} />}
                </div>
              ))}

              {/* Sparkles released when the lid lifts */}
              {SPARKS.map((spark, index) => (
                <div
                  key={index}
                  className={`pg-spark${"teal" in spark ? " pg-spark-teal" : ""}`}
                  style={{ animationDelay: `${spark.delay}s`, "--x": `${spark.x}px`, "--z": `${spark.z}px` } as Vars}
                />
              ))}

              <div className="pg-lid">
                {FACE_SHADES.map((shade, side) => (
                  <div
                    key={side}
                    className="pg-lf"
                    style={{ transform: `rotateY(${side * 90}deg) translateZ(108px)`, "--pg-shade": `rgb(0 0 0 / ${shade})` } as Vars}
                  />
                ))}
                <div className="pg-lt" />
                <div className="pg-lu" />
                <div className="pg-bow">
                  {[0, 45, 90, 135].map((angle) => (
                    <div key={angle} className="pg-bp" style={{ transform: `rotateY(${angle}deg)` }}>
                      <BowLoop />
                    </div>
                  ))}
                  {["rotateY(0deg)", "rotateY(60deg)", "rotateY(120deg)", "rotateX(90deg)"].map((transform) => (
                    <div key={transform} className="pg-kn" style={{ transform }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/*
          Cards live in a flat layer above the 3D scene: inside preserve-3d, depth (not z-index)
          decides overlap, so the swaying box corner used to cut through them. A small shift
          with the pointer keeps the parallax of the tilt.
        */}
        <div
          className="pg-pcards absolute inset-0 z-30"
          style={{ transform: `translate(${(tilt.x * -12).toFixed(1)}px, ${(tilt.y * -8).toFixed(1)}px)` }}
        >
          {featured.map((product, index) => {
            const slot = CARD_SLOTS[index];
            return (
              <div
                key={product.slug}
                className="pg-pcard"
                style={{ ...slot.style, animationDelay: `${slot.delay}s` }}
              >
                <CardThumb product={product} />
                <div className="min-w-0">
                  <p className="text-[11px] leading-4 font-semibold tracking-[0.08em] text-teal">{product.code}</p>
                  <p className="text-[13px] leading-[17px] font-semibold text-ink">{product.name}</p>
                  <p className="text-xs leading-[18px] font-semibold text-teal">
                    {formatPriceRange(product.priceRange.min, product.priceRange.max)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
