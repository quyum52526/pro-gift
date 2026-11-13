import { WHATSAPP_NUMBER } from "./whatsapp";

/** Postal address, split the way schema.org PostalAddress wants it. */
export const SITE_ADDRESS = {
  streetAddress: "Level 7, Suite 2, A K Complex, 19 Green Road",
  addressLocality: "Dhaka",
  postalCode: "1205",
  addressCountry: "BD",
  /** Exact text shown on the site. */
  full: "Level 7, Suite 2, A K Complex, 19 Green Road, Dhanmondi, Dhaka 1205, Bangladesh",
  mapsHref: "https://www.google.com/maps?q=Pro+Gift,+19+Green+Road,+Dhaka+1205",
  mapsEmbed: "https://www.google.com/maps?q=Pro+Gift,+19+Green+Road,+Dhaka+1205&output=embed",
} as const;

/** Public contact details shown in the footer and on /contact. */
export const SITE_CONTACT = {
  whatsapp: { label: `+${WHATSAPP_NUMBER}` },
  phone: { href: "tel:+8801962434901", label: "+880 1962-434901" },
  email: "quyum52526@gmail.com",
  website: { href: "https://www.progift.com.bd", label: "www.progift.com.bd" },
  facebook: { href: "https://www.facebook.com/progiftbd", label: "facebook.com/progiftbd" },
  linkedin: { href: "https://www.linkedin.com/company/pro-gift-bd", label: "linkedin.com/company/pro-gift-bd" },
  instagram: { href: "https://www.instagram.com/pro_gift_bd", label: "instagram.com/pro_gift_bd" },
  areaServed: "Bangladesh",
  social: [
    "https://www.facebook.com/progiftbd",
    "https://www.youtube.com/@PROGIFT-bd",
    "https://www.linkedin.com/company/pro-gift-bd",
    "https://www.instagram.com/pro_gift_bd",
  ],
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
