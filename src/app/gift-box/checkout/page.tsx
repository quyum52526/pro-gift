import type { Metadata } from "next";

import { GiftBoxCheckout } from "@/components/gift-box/gift-box-checkout";

export const metadata: Metadata = {
  title: "Gift Box Checkout",
  robots: { index: false },
};

export default function GiftBoxCheckoutPage() {
  return (
    <main className="flex-1">
      <GiftBoxCheckout />
    </main>
  );
}
