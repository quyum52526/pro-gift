import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { getCategories } from "@/data/products";
import { InlineText } from "@/components/blog/inline-text";
import { WhatsAppIcon } from "@/components/product/whatsapp-icon";
import {
  type BlogBlock,
  type BlogLang,
  blogHref,
  coverFitClass,
  formatPostDate,
  getAllPosts,
  getPost,
  isSvgCover,
  postLang,
} from "@/content/blog";
import { hindSiliguri } from "@/lib/fonts";
import { categoryHref } from "@/lib/catalog/category-filter";
import { DEFAULT_OG_IMAGE, OPEN_GRAPH_DEFAULTS, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";
import { buildGeneralWhatsAppUrl } from "@/lib/whatsapp";

const AUTHOR = "Pro Gift Team";

/** Fixed UI text inside an article, per article language. The breadcrumb stays English. */
const LABELS: Record<BlogLang, Record<string, string>> = {
  en: {
    by: "By",
    author: AUTHOR,
    published: "Published",
    updated: "Updated",
    faq: "Frequently asked questions",
    related: "Related categories",
    ctaHeading: "Need corporate gifts with your logo?",
    ctaText: "Tell us your budget and quantity. We reply with options and a quote.",
    ctaButton: "Get a quote on WhatsApp",
  },
  bn: {
    by: "লিখেছেন:",
    author: "Pro Gift টিম",
    published: "প্রকাশিত",
    updated: "আপডেট",
    faq: "সাধারণ প্রশ্ন",
    related: "সংশ্লিষ্ট ক্যাটাগরি",
    ctaHeading: "লোগোসহ কর্পোরেট গিফট দরকার?",
    ctaText: "আপনার বাজেট আর পরিমাণ জানান। আমরা অপশন আর কোটেশন পাঠাব।",
    ctaButton: "WhatsApp-এ কোটেশন নিন",
  },
};

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  const path = blogHref(post.slug);
  // Social sites reject SVG previews, so SVG covers fall back to the default share image.
  const shareImage = isSvgCover(post.coverImage) ? DEFAULT_OG_IMAGE : { url: post.coverImage, alt: post.coverAlt };
  return {
    title: post.title,
    description: post.metaDescription,
    alternates: { canonical: path },
    authors: [{ name: AUTHOR }],
    openGraph: {
      ...OPEN_GRAPH_DEFAULTS,
      ...(postLang(post) === "bn" && { locale: "bn_BD" }),
      type: "article",
      title: post.title,
      description: post.metaDescription,
      url: path,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [AUTHOR],
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.metaDescription,
      images: [shareImage],
    },
  };
}

function Block({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case "h2":
      return <h2 className="mt-4 text-2xl leading-snug font-bold text-ink">{block.text}</h2>;
    case "h3":
      return <h3 className="mt-2 text-lg leading-snug font-semibold text-ink">{block.text}</h3>;
    case "p":
      return (
        <p>
          <InlineText text={block.text} />
        </p>
      );
    case "ul":
    case "ol": {
      const List = block.type;
      return (
        <List className={`flex flex-col gap-2 pl-6 ${block.type === "ul" ? "list-disc" : "list-decimal"}`}>
          {block.items.map((item) => (
            <li key={item}>
              <InlineText text={item} />
            </li>
          ))}
        </List>
      );
    }
  }
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  // Same fallback as the header: an outage only drops the related category links.
  const categories = await getCategories().catch(() => []);
  const related = (post.relatedCategories ?? [])
    .map((categorySlug) => categories.find((category) => category.slug === categorySlug))
    .filter((category) => category !== undefined);

  const pageUrl = `${SITE_URL}${blogHref(post.slug)}`;
  const whatsappUrl = buildGeneralWhatsAppUrl();
  const updated = post.updatedAt !== post.publishedAt;
  const lang = postLang(post);
  const bn = lang === "bn";
  const t = LABELS[lang];
  // Bangla has no case and letter-spacing pulls its conjuncts apart, so the small-caps label style is English only.
  const eyebrow = bn ? "" : "tracking-[0.08em] uppercase";

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: pageUrl },
    ],
  };
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    image: [absoluteUrl(post.coverImage)],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: lang,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    author: { "@type": "Organization", name: AUTHOR, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/brand/icon-512.png") },
    },
  };
  const faqJsonLd = post.faqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: post.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      }
    : null;

  return (
    <main className="flex-1">
      {[breadcrumbJsonLd, articleJsonLd, faqJsonLd].map(
        (jsonLd) =>
          jsonLd && (
            <script
              key={jsonLd["@type"]}
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
            />
          ),
      )}

      <div className="mx-auto w-full max-w-[820px] px-4 pt-6 pb-16 sm:px-6 md:pt-8">
        <nav aria-label="Breadcrumb">
          <ol className="flex min-w-0 items-center text-sm text-muted-foreground">
            {[
              { name: "Home", href: "/" },
              { name: "Blog", href: "/blog" },
            ].map((crumb) => (
              <li key={crumb.href} className="flex shrink-0 items-center">
                <Link href={crumb.href} className="transition-colors hover:text-teal">
                  {crumb.name}
                </Link>
                <ChevronRight className="mx-1 h-4 w-4 shrink-0" aria-hidden />
              </li>
            ))}
            <li className="min-w-0">
              <span
                aria-current="page"
                lang={bn ? "bn" : undefined}
                className={`block truncate text-ink ${bn ? hindSiliguri.variable : ""}`}
              >
                {post.title}
              </span>
            </li>
          </ol>
        </nav>

        {/* lang + the font variable scope the Bangla font to this content (see globals.css :lang(bn)). */}
        <div lang={bn ? "bn" : undefined} className={bn ? hindSiliguri.variable : undefined}>
          <article className="mt-6">
            <header className="flex flex-col gap-4">
              <h1
                className={`text-[clamp(28px,4.2vw,40px)] font-bold text-ink ${bn ? "leading-[1.4]" : "leading-[1.2]"}`}
              >
                {post.title}
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                {t.by} <span className="font-semibold text-ink">{t.author}</span> · {t.published}{" "}
                <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt, lang)}</time>
                {updated && (
                  <>
                    {" "}
                    · {t.updated} <time dateTime={post.updatedAt}>{formatPostDate(post.updatedAt, lang)}</time>
                  </>
                )}
              </p>
              <Image
                src={post.coverImage}
                alt={post.coverAlt}
                width={1200}
                height={630}
                priority
                sizes="(min-width: 820px) 772px, 100vw"
                className={`mt-2 block aspect-[1200/630] h-auto w-full rounded-2xl bg-surface-tint ${coverFitClass(post.coverImage)}`}
              />
            </header>

            <div className="mt-8 flex flex-col gap-5 text-base leading-7 text-ink/90">
              {post.body.map((block, index) => (
                <Block key={index} block={block} />
              ))}
            </div>
          </article>

          {post.faqs?.length ? (
            <section aria-labelledby="post-faq" className="mt-14">
              <h2 id="post-faq" className="text-xl font-bold text-ink">
                {t.faq}
              </h2>
              <dl className="mt-5 flex flex-col gap-4">
                {post.faqs.map((faq) => (
                  <div key={faq.question} className="rounded-2xl bg-surface-tint p-5">
                    <dt className="font-semibold text-ink">{faq.question}</dt>
                    <dd className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {related.length > 0 && (
            <nav aria-labelledby="related-categories" className="mt-14">
              <h2 id="related-categories" className={`text-xs font-semibold text-teal ${eyebrow}`}>
                {t.related}
              </h2>
              {/* Category names are English. */}
              <ul lang={bn ? "en" : undefined} className="mt-4 flex flex-wrap gap-3">
                {related.map((category) => (
                  <li key={category.slug}>
                    <Link href={categoryHref(category.slug)} className="pg-btn pg-btn-line">
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <aside className="mt-14 flex flex-col items-start gap-4 rounded-2xl bg-ink p-6 text-surface sm:p-8">
            <h2 className="text-2xl leading-snug font-bold">{t.ctaHeading}</h2>
            <p className="text-base leading-6">{t.ctaText}</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pg-btn mt-1 bg-whatsapp text-surface shadow-[0_5px_0_var(--color-whatsapp-dark)] hover:shadow-[0_8px_0_var(--color-whatsapp-dark)]"
            >
              <WhatsAppIcon className="size-5" />
              {t.ctaButton}
            </a>
          </aside>
        </div>
      </div>
    </main>
  );
}
