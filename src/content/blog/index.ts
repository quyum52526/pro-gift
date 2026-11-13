import type { BlogPost } from "./types";
import yearEndGiftIdeas from "./year-end-new-year-corporate-gift-ideas-bangladesh";

export type { BlogBlock, BlogFaq, BlogPost } from "./types";

// Register each article file here.
const POSTS: BlogPost[] = [yearEndGiftIdeas];

/** All articles, newest first. */
export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((post) => post.slug === slug);
}

export function blogHref(slug: string): string {
  return `/blog/${slug}`;
}

/** "13 November 2026". UTC so the server's zone never shifts the day. */
export function formatPostDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(isoDate),
  );
}
