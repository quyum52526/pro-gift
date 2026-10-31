"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { WhatsAppIcon } from "@/components/product/whatsapp-icon";
import { summarizeGiftBox } from "@/lib/gift-box/catalog";
import { useGiftBoxConfig } from "@/lib/gift-box/store";
import { formatBDT } from "@/lib/utils";
import { buildGiftBoxWhatsAppUrl } from "@/lib/whatsapp";
import { GiftBoxPreviewPanel } from "./gift-box-preview";

export function GiftBoxCheckout() {
  const config = useGiftBoxConfig();
  const { box, lines, itemCount, total } = summarizeGiftBox(config);

  if (itemCount === 0) {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-ink">Your gift box is empty</h1>
        <p className="mt-2 text-muted-foreground">Add at least one product before checking out.</p>
        <Link href="/gift-box" className="pg-btn pg-btn-teal mt-6">
          Build a gift box
        </Link>
      </div>
    );
  }

  const orderUrl = buildGiftBoxWhatsAppUrl({
    boxName: box.name,
    boxPrice: box.price,
    lines: lines.map(({ item, quantity, total: lineTotal }) => ({
      name: item.name,
      quantity,
      total: lineTotal,
    })),
    total,
    withLogo: config.logo !== null,
  });

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pt-8 pb-16 sm:px-6">
      <Link
        href="/gift-box"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-teal hover:text-teal-dark"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to your box
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">Checkout</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-start">
        <GiftBoxPreviewPanel config={config} />

        <section aria-labelledby="order-heading" className="rounded-2xl border bg-surface p-5 shadow-card">
          <h2 id="order-heading" className="font-semibold text-ink">
            Order summary
          </h2>
          <ul className="mt-3 divide-y text-sm text-ink">
            <li className="flex justify-between gap-3 py-2">
              <span>{box.name}</span>
              <span className="tabular-nums">{formatBDT(box.price)}</span>
            </li>
            {lines.map(({ item, quantity, total: lineTotal }) => (
              <li key={item.id} className="flex justify-between gap-3 py-2">
                <span>
                  {item.name} × {quantity}
                </span>
                <span className="tabular-nums">{formatBDT(lineTotal)}</span>
              </li>
            ))}
            <li className="flex justify-between gap-3 py-2">
              <span>Logo</span>
              <span className="min-w-0 truncate text-muted-foreground">
                {config.logo?.fileName ?? "No logo"}
              </span>
            </li>
          </ul>
          <div className="mt-2 flex items-baseline justify-between border-t pt-3">
            <span className="font-semibold text-ink">Total</span>
            <span className="text-2xl font-bold text-teal tabular-nums">{formatBDT(total)}</span>
          </div>
          <a
            href={orderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-whatsapp px-6 font-medium text-surface transition-colors hover:bg-whatsapp-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <WhatsAppIcon className="h-5 w-5" /> Place order on WhatsApp
          </a>
          <p className="mt-3 text-xs text-muted-foreground">
            We confirm the final price and delivery time on WhatsApp.
            {config.logo && " Please attach your logo file to the chat, as it can't be sent automatically."}
          </p>
        </section>
      </div>
    </div>
  );
}
