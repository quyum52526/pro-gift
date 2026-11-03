import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { DEFAULT_OG_IMAGE, OPEN_GRAPH_DEFAULTS, SITE_NAME, SITE_URL } from "@/lib/site";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const DEFAULT_TITLE = "Pro Gift | Premium Corporate Gifts in Bangladesh";
const DEFAULT_DESCRIPTION =
  "Premium corporate gifts in Bangladesh with custom logo branding: crests, awards, diaries, mugs, power banks and gift boxes. Request a bulk quote on WhatsApp.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "corporate gifts Bangladesh",
    "corporate gift shop Bangladesh",
    "corporate gift items BD",
    "custom logo gifts Bangladesh",
    "branded promotional items Bangladesh",
    "employee gifts Bangladesh",
    "custom gift box Bangladesh",
    "crest and award Bangladesh",
    "Pro Gift",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  // Generated from public/pro-gift-logo-icon.* (cropped, see public/brand).
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/brand/logo-icon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    ...OPEN_GRAPH_DEFAULTS,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  // Title, description and image are filled per page from its openGraph.
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#1F6F8B",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
