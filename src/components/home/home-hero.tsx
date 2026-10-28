import type { CSSProperties } from "react";

import { buildGeneralWhatsAppUrl } from "@/lib/whatsapp";
import type { Product } from "@/types/product";
import { HeroStage } from "./hero-stage";

// Layout from the Claude Design canvas "Pro Gift — 3D Header, Hero & Footer".
const HIGHLIGHTS = ["Branded with your logo", "Delivered across Bangladesh", "Quotes on WhatsApp"] as const;

const delay = (seconds: number): CSSProperties => ({ animationDelay: `${seconds}s` });

export function HomeHero({ products }: { products: Product[] }) {
  return (
    <section className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-10 px-6 pt-14 pb-16">
      <div className="flex min-w-0 flex-[1_1_460px] flex-col items-start gap-6">
        <p className="pg-rise text-sm leading-5 tracking-[0.3em] text-teal uppercase" style={delay(0.2)}>
          Pro Gift
        </p>
        <h1 className="pg-rise text-[clamp(40px,6.4vw,56px)] leading-[1.07] font-extrabold text-ink" style={delay(0.35)}>
          Premium corporate <span className="pg-hl">gifts</span>
        </h1>
        <p className="pg-rise max-w-[480px] text-lg leading-7 text-ink" style={delay(0.5)}>
          Branded with your logo, delivered across Bangladesh. Request a quote on WhatsApp.
        </p>
        {/* Bottom padding leaves room for the buttons' 3D edge. */}
        <div className="pg-rise flex flex-wrap gap-4 pb-1.5" style={delay(0.65)}>
          <a
            href={buildGeneralWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="pg-btn pg-btn-teal"
          >
            Request a quote
          </a>
          <a href="#catalog" className="pg-btn pg-btn-line">
            Browse all gifts
          </a>
        </div>
        <ul className="pg-rise flex flex-wrap gap-x-7 gap-y-3" style={delay(0.65)}>
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-sm leading-5 text-teal">
              <span className="block h-2.5 w-2.5 flex-none rounded-[2px] bg-gold" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <HeroStage products={products} />
    </section>
  );
}
