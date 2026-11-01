import type { Metadata } from "next";

import { GiftBoxCheckout } from "@/components/gift-box/gift-box-checkout";
import { getGiftBoxItems } from "@/data/products";

export const metadata: Metadata = {
  title: "Gift Box Checkout",
  robots: { index: false },
};

export default async function GiftBoxCheckoutPage() {
  const catalogue = await getGiftBoxItems();
  return (
    <main className="flex-1">
      <GiftBoxCheckout catalogue={catalogue} />
    </main>
  );
}
