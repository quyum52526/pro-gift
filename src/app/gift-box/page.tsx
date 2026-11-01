import type { Metadata } from "next";

import { GiftBoxBuilder } from "@/components/gift-box/gift-box-builder";
import { getGiftBoxItems } from "@/data/products";

export const metadata: Metadata = {
  title: "Build a Custom Gift Box",
  description: "Choose a box, add products and preview your logo on a custom corporate gift box.",
  alternates: { canonical: "/gift-box" },
};

export default async function GiftBoxPage() {
  const catalogue = await getGiftBoxItems();
  return (
    <main className="flex-1">
      <GiftBoxBuilder catalogue={catalogue} />
    </main>
  );
}
