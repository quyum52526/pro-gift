import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { getCategories, getProducts } from "@/data/products";
import { CatalogGrid, CatalogGridSkeleton } from "@/components/product/catalog-grid";
import { WhatsAppIcon } from "@/components/product/whatsapp-icon";
import { categoryContent } from "@/lib/catalog/category-content";
import { categoryHref, filterByCategory } from "@/lib/catalog/category-filter";
import { DEFAULT_OG_IMAGE, OPEN_GRAPH_DEFAULTS, SITE_URL } from "@/lib/site";
import { buildCategoryWhatsAppUrl } from "@/lib/whatsapp";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

async function findCategory(slug: string) {
  const categories = await getCategories();
  return categories.find((category) => category.slug === slug);
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await findCategory(slug);
  if (!category) return {};

  const { h1, description } = categoryContent(category);
  const title = `${h1} | Pro Gift`;
  const path = categoryHref(category.slug);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      ...OPEN_GRAPH_DEFAULTS,
      title,
      description,
      url: path,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  // Same shape as the product page: slug-dependent work suspends inside the boundary.
  return (
    <main className="flex-1">
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 sm:px-6">
            <CatalogGridSkeleton />
          </div>
        }
      >
        <CategoryContent params={params} />
      </Suspense>
    </main>
  );
}

async function CategoryContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, products] = await Promise.all([findCategory(slug), getProducts()]);
  if (!category) notFound();

  const content = categoryContent(category);
  const items = filterByCategory(products, category.slug);
  const whatsappUrl = buildCategoryWhatsAppUrl(category.name);
  const pageUrl = `${SITE_URL}${categoryHref(category.slug)}`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: category.name, item: pageUrl },
    ],
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <>
      {[breadcrumbJsonLd, faqJsonLd].map((jsonLd) => (
        <script
          key={jsonLd["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      ))}

      <div className="mx-auto w-full max-w-[1200px] px-4 pt-6 pb-16 sm:px-6 md:pt-8">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center text-sm text-muted-foreground">
            <li className="flex items-center">
              <Link href="/" className="transition-colors hover:text-teal">
                Home
              </Link>
              <ChevronRight className="mx-1 h-4 w-4 shrink-0" aria-hidden />
            </li>
            <li className="min-w-0">
              <span aria-current="page" className="truncate text-ink">
                {category.name}
              </span>
            </li>
          </ol>
        </nav>

        <header className="mt-6 flex max-w-[820px] flex-col items-start gap-5">
          <h1 className="text-[clamp(28px,4.2vw,40px)] leading-[1.2] font-bold text-ink">{content.h1}</h1>
          <p className="text-base leading-7 text-muted-foreground">{content.intro}</p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pg-btn mt-1 bg-whatsapp text-surface shadow-[0_5px_0_var(--color-whatsapp-dark)] hover:shadow-[0_8px_0_var(--color-whatsapp-dark)]"
          >
            <WhatsAppIcon className="size-5" />
            Get a quote on WhatsApp
          </a>
        </header>

        <CatalogGrid products={items} heading={category.name} />

        <section aria-labelledby="category-faq" className="mt-14 max-w-[820px]">
          <h2 id="category-faq" className="text-xl font-bold text-ink">
            Frequently asked questions
          </h2>
          <dl className="mt-5 flex flex-col gap-4">
            {content.faqs.map((faq) => (
              <div key={faq.question} className="rounded-2xl bg-surface-tint p-5">
                <dt className="font-semibold text-ink">{faq.question}</dt>
                <dd className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
