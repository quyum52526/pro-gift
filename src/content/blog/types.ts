/**
 * One block of article body. Plain data, rendered without raw HTML.
 * Paragraph and list item text supports [text](/path) links and **bold**.
 */
export type BlogBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

export interface BlogFaq {
  question: string;
  answer: string;
}

export type BlogLang = "en" | "bn";

export interface BlogPost {
  slug: string;
  /** Article language. Defaults to "en". */
  lang?: BlogLang;
  title: string;
  /** 150-160 characters. */
  metaDescription: string;
  /** Shown on the /blog list. */
  excerpt: string;
  /** ISO date, e.g. "2026-11-13". */
  publishedAt: string;
  updatedAt: string;
  /** Site-relative path under /public, or an allowed remote image URL. */
  coverImage: string;
  coverAlt: string;
  body: BlogBlock[];
  faqs?: BlogFaq[];
  /** Category slugs linked under "Related categories". */
  relatedCategories?: string[];
}
