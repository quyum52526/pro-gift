import employeeClientGiftsBangla from "./corporate-gift-ideas-employees-clients-bangla";
import howToOrderBrandedGifts from "./how-to-order-logo-branded-corporate-gifts-bangladesh";
import type { BlogLang, BlogPost } from "./types";
import yearEndGiftIdeas from "./year-end-new-year-corporate-gift-ideas-bangladesh";

export type { BlogBlock, BlogFaq, BlogLang, BlogPost } from "./types";

// Register each article file here, newest first: same-day posts keep this order.
const POSTS: BlogPost[] = [employeeClientGiftsBangla, howToOrderBrandedGifts, yearEndGiftIdeas];

/** All articles, newest first. */
export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((post) => post.slug === slug);
}

export function postLang(post: BlogPost): BlogLang {
  return post.lang ?? "en";
}

export function blogHref(slug: string): string {
  return `/blog/${slug}`;
}

/** SVG covers are portrait product art, so show them whole; photo covers fill the banner. */
export function isSvgCover(src: string): boolean {
  return src.endsWith(".svg");
}

export function coverFitClass(src: string): string {
  return isSvgCover(src) ? "object-contain" : "object-cover";
}

/** "13 November 2026" or "১৩ নভেম্বর, ২০২৬". UTC so the server's zone never shifts the day. */
export function formatPostDate(isoDate: string, lang: BlogLang = "en"): string {
  return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(isoDate));
}
