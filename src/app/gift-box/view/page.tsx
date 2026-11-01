import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getGiftBoxItems } from "@/data/products";
import { summarizeGiftBox } from "@/lib/gift-box/catalog";
import { GIFT_BOX_CONFIG_PARAM, decodeGiftBoxConfig } from "@/lib/gift-box/share";
import { formatBDT } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Gift Box Inquiry",
  robots: { index: false },
};

export default function GiftBoxViewPage({ searchParams }: PageProps<"/gift-box/view">) {
  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-[800px] px-4 pt-8 pb-16 sm:px-6">
        <Suspense fallback={<p className="text-muted-foreground">Loading gift box…</p>}>
          <GiftBoxBreakdown searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function GiftBoxBreakdown({ searchParams }: Pick<PageProps<"/gift-box/view">, "searchParams">) {
  const encoded = (await searchParams)[GIFT_BOX_CONFIG_PARAM];
  const shared = typeof encoded === "string" ? decodeGiftBoxConfig(encoded) : null;
  const requested = shared ? Object.values(shared.items).reduce((count, quantity) => count + quantity, 0) : 0;

  if (!shared || requested === 0) {
    return (
      <div className="py-8 text-center">
        <h1 className="text-2xl font-bold text-ink">This gift box link isn&apos;t valid</h1>
        <p className="mt-2 text-muted-foreground">It may be incomplete. Check that the whole link was copied.</p>
        <Link href="/gift-box" className="pg-btn pg-btn-teal mt-6">
          Build a gift box
        </Link>
      </div>
    );
  }

  const catalogue = await getGiftBoxItems();
  const { box, lines, itemCount, total } = summarizeGiftBox({ ...shared, logo: null }, catalogue);
  const unavailable = requested - itemCount;

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-ink">Gift box inquiry</h1>
      <p className="mt-2 text-muted-foreground">
        {box.name} with {itemCount} of {box.capacity} items
      </p>

      {unavailable > 0 && (
        <p role="alert" className="mt-4 rounded-xl border border-red-300 p-3 text-sm text-red-700">
          {unavailable} selected {unavailable === 1 ? "item is" : "items are"} no longer available and not shown or
          priced here. Check the WhatsApp message for the customer&apos;s full list.
        </p>
      )}

      <section aria-label="Box contents" className="mt-6 rounded-2xl border bg-surface p-5 shadow-card">
        <ul className="divide-y">
          <li className="flex items-center justify-between gap-3 pb-3">
            <span className="font-semibold text-ink">{box.name}</span>
            <span className="tabular-nums text-ink">{formatBDT(box.price)}</span>
          </li>
          {lines.map(({ item, quantity, total: lineTotal }) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-tint">
                <Image src={item.image.src} alt={item.image.alt} fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-ink">{item.name}</h2>
                <p className="text-xs text-muted-foreground">SKU: {item.code}</p>
                <p className="text-sm tabular-nums text-muted-foreground">
                  {quantity} × from {formatBDT(item.price)}
                </p>
              </div>
              <span className="shrink-0 tabular-nums text-ink">{formatBDT(lineTotal)}</span>
            </li>
          ))}
          <li className="flex justify-between gap-3 py-3 text-sm">
            <span className="text-ink">Logo</span>
            <span className="min-w-0 truncate text-right text-muted-foreground">
              {shared.logoName ? `${shared.logoName} (customer sends the file on WhatsApp)` : "No logo"}
            </span>
          </li>
        </ul>
        <div className="flex items-baseline justify-between border-t pt-3">
          <span className="font-semibold text-ink">Estimated total</span>
          <span className="text-2xl font-bold text-teal tabular-nums">{formatBDT(total)}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Uses today&apos;s starting prices, which may differ from the customer&apos;s message if prices have changed.
        </p>
      </section>
    </>
  );
}
