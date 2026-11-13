import { Hind_Siliguri } from "next/font/google";

/**
 * Bangla font (with matching Latin) for lang="bn" blog content. Exposed as --font-bangla; globals.css applies it under :lang(bn).
 * Imported only by blog routes, so other pages never preload it.
 */
export const hindSiliguri = Hind_Siliguri({
  variable: "--font-bangla",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
