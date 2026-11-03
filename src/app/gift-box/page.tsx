import type { Metadata } from "next";

import { GiftBoxBuilder } from "@/components/gift-box/gift-box-builder";
import { getGiftBoxItems } from "@/data/products";
import { DEFAULT_OG_IMAGE, OPEN_GRAPH_DEFAULTS } from "@/lib/site";

const DESCRIPTION = "Choose a box, add products and preview your logo on a custom corporate gift box.";

export const metadata: Metadata = {
  title: "Build a Custom Gift Box",
  description: DESCRIPTION,
  alternates: { canonical: "/gift-box" },
  openGraph: {
    ...OPEN_GRAPH_DEFAULTS,
    title: "Build a Custom Gift Box",
    description: DESCRIPTION,
    url: "/gift-box",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function GiftBoxPage() {
  const catalogue = await getGiftBoxItems();
  return (
    <main className="flex-1">
      <GiftBoxBuilder catalogue={catalogue} />
    </main>
  );
}
