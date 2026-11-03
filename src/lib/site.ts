import { WHATSAPP_NUMBER } from "./whatsapp";

/** Public contact details shown in the footer. */
export const SITE_CONTACT = {
  whatsapp: { label: `+${WHATSAPP_NUMBER}` },
  email: "quyum52526@gmail.com",
  website: { href: "https://www.progift.com.bd", label: "www.progift.com.bd" },
  facebook: { href: "https://www.facebook.com/progiftbd", label: "facebook.com/progiftbd" },
} as const;

export const SITE_NAME = "Pro Gift";

function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (process.env.NODE_ENV !== "production") return configured ?? "http://localhost:3000";
  // A localhost value copied from .env.example must never reach crawlers or share links.
  return configured && !configured.includes("localhost") ? configured : SITE_CONTACT.website.href;
}

/** Public site origin, without a trailing slash. */
export const SITE_URL = resolveSiteUrl();

/** Uploaded images are absolute Supabase URLs; bundled ones are site-relative. */
export function absoluteUrl(src: string): string {
  return src.startsWith("/") ? `${SITE_URL}${src}` : src;
}

/** Default social share image, 1200x630. Generated from public/pro-gift-logo.png. */
export const DEFAULT_OG_IMAGE = {
  url: "/brand/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Pro Gift – Premium Corporate Gifts in Bangladesh",
};

/** Page-level openGraph replaces the root one entirely, so pages spread these back in. */
export const OPEN_GRAPH_DEFAULTS = {
  type: "website",
  siteName: SITE_NAME,
  locale: "en_BD",
} as const;
