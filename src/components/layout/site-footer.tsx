import Image from "next/image";
import Link from "next/link";
import { cacheLife } from "next/cache";

import { getCategories } from "@/data/products";
import { categoryHref } from "@/lib/catalog/category-filter";
import { SITE_CONTACT } from "@/lib/site";
import { buildGeneralWhatsAppUrl } from "@/lib/whatsapp";
import { BackToTop } from "./back-to-top";

const COIN_LAYERS = [-5, -3, -1, 1, 3, 5] as const;

// Cache Components rejects a bare `new Date()` in a prerendered component; a cached read is fine.
async function copyrightYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function SiteFooter() {
  // Same fallback as the header: an outage only drops the category links.
  const [categories, year] = await Promise.all([getCategories().catch(() => []), copyrightYear()]);
  const whatsappUrl = buildGeneralWhatsAppUrl();

  const contacts = [
    { label: "WhatsApp", value: SITE_CONTACT.whatsapp.label, href: whatsappUrl, external: true },
    { label: "Email", value: SITE_CONTACT.email, href: `mailto:${SITE_CONTACT.email}`, external: false },
    { label: "Website", value: SITE_CONTACT.website.label, href: SITE_CONTACT.website.href, external: true },
    { label: "Facebook", value: SITE_CONTACT.facebook.label, href: SITE_CONTACT.facebook.href, external: true },
  ];

  return (
    <footer className="pg-footer bg-ink text-surface">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-14 px-6 pt-[72px] pb-8">
        <div className="flex flex-wrap items-center justify-between gap-8">
          <div className="flex min-w-0 flex-[1_1_420px] flex-col items-start gap-5">
            <h2 className="text-[clamp(30px,4.6vw,36px)] leading-[1.22] font-bold">Request a quote on WhatsApp</h2>
            <p className="max-w-[460px] text-base leading-6">Branded with your logo, delivered across Bangladesh.</p>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="pg-btn pg-btn-gold mt-1.5">
              Talk to us
            </a>
          </div>

          {/* Spinning gold coin stamped with the gift-box mark */}
          <div className="relative h-44 w-44 flex-none perspective-[700px]" aria-hidden>
            <div className="pg-coin">
              {COIN_LAYERS.map((z, index) => (
                <div
                  key={z}
                  className={`pg-coin-layer ${index % 2 ? "bg-gold" : "bg-gold-deep"}`}
                  style={{ transform: `translateZ(${z}px)` }}
                />
              ))}
              {["translateZ(7px)", "rotateY(180deg) translateZ(7px)"].map((transform) => (
                <div
                  key={transform}
                  className="pg-coin-layer flex items-center justify-center bg-surface"
                  style={{ transform }}
                >
                  <Image src="/brand/logo-icon.svg" alt="" width={84} height={84} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-x-10 gap-y-12">
          <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-4">
            <a href="#top" aria-label="Pro Gift, back to top" className="block rounded-2xl bg-surface px-[22px] py-5">
              <Image
                src="/brand/logo-wordmark.svg"
                alt="Pro Gift Corporate Gift Shop"
                width={869}
                height={194}
                className="block h-auto w-full max-w-[220px]"
              />
            </a>
            <p className="text-sm leading-5">Premium corporate gifts.</p>
          </div>

          <nav aria-label="Footer gift categories" className="flex min-w-0 flex-[1_1_200px] flex-col gap-3.5">
            <h3 className="text-xs font-semibold tracking-[0.08em] text-gold uppercase">Gifts</h3>
            <ul className="flex flex-col items-start gap-1.5">
              {[{ name: "All Gifts", slug: undefined }, ...categories].map(({ name, slug }) => (
                <li key={slug ?? "all"}>
                  <Link href={`${categoryHref(slug)}#catalog`} className="pg-flink">
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex min-w-0 flex-[2_1_420px] flex-col gap-[18px]">
            <h3 className="text-xs font-semibold tracking-[0.08em] text-gold uppercase">Contact</h3>
            {/* Bottom padding leaves room for the tiles' 3D edge. */}
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-x-5 gap-y-[22px] pb-1.5">
              {contacts.map((contact) => (
                <li key={contact.label} className="flex">
                  <a
                    href={contact.href}
                    {...(contact.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="pg-tile flex-1"
                  >
                    <span className="text-xs font-semibold tracking-[0.08em] uppercase">{contact.label}</span>
                    <span className="text-[15px] leading-[22px] font-medium">{contact.value}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-5 border-t border-surface/20 pt-7">
          <p className="text-sm leading-5">© {year} Pro Gift · Corporate Gift Shop</p>
          <BackToTop />
        </div>
      </div>
    </footer>
  );
}
