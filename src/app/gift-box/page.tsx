import type { Metadata } from "next";

import { GiftBoxBuilder } from "@/components/gift-box/gift-box-builder";

export const metadata: Metadata = {
  title: "Build a Custom Gift Box",
  description: "Choose a box, add products and preview your logo on a custom corporate gift box.",
  alternates: { canonical: "/gift-box" },
};

export default function GiftBoxPage() {
  return (
    <main className="flex-1">
      <GiftBoxBuilder />
    </main>
  );
}
