import type { Metadata } from "next";
import Link from "next/link";

import { getProducts } from "@/data/products";
import { CatalogGrid } from "@/components/product/catalog-grid";
import { HomeHero } from "@/components/home/home-hero";
import { ProductStrip } from "@/components/home/product-strip";
import { categoryHref } from "@/lib/catalog/category-filter";
import { DEFAULT_OG_IMAGE, OPEN_GRAPH_DEFAULTS } from "@/lib/site";
import { buildGeneralWhatsAppUrl } from "@/lib/whatsapp";

const HOME_TITLE = "Corporate Gift Shop in Dhaka | Custom Logo Gifts – Pro Gift";
const HOME_DESCRIPTION =
  "Pro Gift is a corporate gift shop in Dhaka for custom logo-branded gifts: diaries, crests, gift boxes and tech gifts. Bulk orders, delivery across Bangladesh.";

export const metadata: Metadata = {
  // absolute: the title already names the brand, so skip the "| Pro Gift" template.
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    ...OPEN_GRAPH_DEFAULTS,
    url: "/",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

const HOME_FAQS = [
  {
    question: "Where is Pro Gift's corporate gift shop in Dhaka?",
    answer:
      "Pro Gift is at Level 7, Suite 2, A K Complex, 19 Green Road, Dhanmondi, Dhaka 1205. Please contact us on WhatsApp before you visit.",
  },
  {
    question: "Do you deliver corporate gifts across Dhaka?",
    answer:
      "Yes. We deliver corporate gifts across Dhaka and to all of Bangladesh. Send your requirements on WhatsApp and we will confirm the timing for your order.",
  },
  {
    question: "Can you add our company logo to the gifts?",
    answer: "Yes. We offer custom logo branding, so your company logo can be added to the gifts you order.",
  },
  {
    question: "How do I get a quote?",
    answer: "Send us the product codes, the quantity you need and your logo on WhatsApp, and we will reply with a quote.",
  },
] as const;

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: HOME_FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

const textLink = "font-medium text-teal underline-offset-4 hover:underline";

export default async function Home() {
  const products = await getProducts();

  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD).replace(/</g, "\\u003c") }}
      />
      <HomeHero products={products} />
      <ProductStrip products={products} />
      <div className="mx-auto w-full max-w-[1200px] px-6 pt-8">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-surface-tint p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-ink">Build your own gift box</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a box and products, then preview them with your logo.
            </p>
          </div>
          <Link href="/gift-box" className="pg-btn pg-btn-teal shrink-0">
            Start building
          </Link>
        </div>
      </div>
      <div id="catalog" className="mx-auto w-full max-w-[1200px] scroll-mt-4 px-6 pt-6 pb-16">
        {/* All gifts; each category has its own page at /category/<slug>. */}
        <CatalogGrid products={products} />
      </div>

      <div className="mx-auto w-full max-w-[1200px] px-6 pb-16">
        <section aria-labelledby="home-about" className="max-w-[820px]">
          <h2 id="home-about" className="text-xl font-bold text-ink">
            Your Corporate Gift Shop in Dhaka
          </h2>
          <div className="mt-4 flex flex-col gap-4 text-base leading-7 text-muted-foreground">
            <p>
              Pro Gift is a corporate gift shop in Dhaka, based at A K Complex, 19 Green Road, Dhanmondi. We supply
              corporate gifts with custom logo branding, so every item you order can carry your company logo.
            </p>
            <p>
              Our range covers{" "}
              <Link href={categoryHref("handcrafted-leather")} className={textLink}>
                leather gifts
              </Link>
              , diaries,{" "}
              <Link href={categoryHref("awards-crests")} className={textLink}>
                crests and awards
              </Link>
              , desk sets, tech gifts,{" "}
              <Link href={categoryHref("luxury-boxes")} className={textLink}>
                gift boxes
              </Link>{" "}
              and promotional items. You can choose one branded item for everyone or combine several products into a
              set that fits your budget and occasion. Every product card shows a product code, which makes it easy to
              compare options and tell us exactly what you want.
            </p>
            <p>
              We handle bulk corporate orders and deliver across Dhaka and to all of Bangladesh. To start, browse the
              catalog above, note the product codes you like, and send them with your quantity and logo. Quotes are
              given on{" "}
              <a href={buildGeneralWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className={textLink}>
                WhatsApp
              </a>
              , where you can also ask about branding options before you order. For our address, phone and other ways
              to reach us, see the{" "}
              <Link href="/contact" className={textLink}>
                contact page
              </Link>
              .
            </p>
          </div>
        </section>

        <section aria-labelledby="home-faq" className="mt-14 max-w-[820px]">
          <h2 id="home-faq" className="text-xl font-bold text-ink">
            Frequently asked questions
          </h2>
          <dl className="mt-5 flex flex-col gap-4">
            {HOME_FAQS.map((faq) => (
              <div key={faq.question} className="rounded-2xl bg-surface-tint p-5">
                <dt className="font-semibold text-ink">{faq.question}</dt>
                <dd className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}
