"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ImageUp, Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GIFT_BOXES, GIFT_ITEMS, summarizeGiftBox, type GiftItem } from "@/lib/gift-box/catalog";
import {
  changeGiftItemQuantity,
  selectGiftBox,
  setGiftBoxLogo,
  useGiftBoxConfig,
} from "@/lib/gift-box/store";
import { cn, formatBDT } from "@/lib/utils";
import { GiftBoxPreviewPanel, GiftItemThumbnail } from "./gift-box-preview";

const ACCEPTED_TYPES = ["image/png", "image/svg+xml", "image/jpeg", "image/webp"];
// Base64 adds about a third, and the data URL has to fit in sessionStorage.
const MAX_FILE_BYTES = 2 * 1024 * 1024;

export function GiftBoxBuilder() {
  const router = useRouter();
  const config = useGiftBoxConfig();
  const { box, lines, itemCount, total } = summarizeGiftBox(config);
  const isFull = itemCount >= box.capacity;
  const logoUrl = config.logo?.dataUrl;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pt-8 pb-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Build your gift box</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Choose a box, fill it with products and add your logo. The preview and price update as you go.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-start">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="box-heading">
            <StepHeading id="box-heading" step={1} title="Choose your box" />
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {GIFT_BOXES.map((option) => {
                const selected = option.id === box.id;
                const tooSmall = itemCount > option.capacity;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    disabled={tooSmall}
                    onClick={() => selectGiftBox(option.id)}
                    className={cn(
                      "rounded-xl border-2 bg-surface p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      selected ? "border-teal bg-surface-tint" : "border-border hover:border-teal",
                      tooSmall && "cursor-not-allowed opacity-60 hover:border-border",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2 font-semibold text-ink">
                      {option.name}
                      {selected && <Check className="h-4 w-4 shrink-0 text-teal" aria-hidden />}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">{option.description}</span>
                    <span className="mt-3 flex items-baseline justify-between gap-2">
                      <span className="font-semibold text-teal">{formatBDT(option.price)}</span>
                      <span className="text-xs text-muted-foreground">
                        {tooSmall
                          ? `Remove ${itemCount - option.capacity} to fit`
                          : `Holds ${option.capacity} items`}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="items-heading">
            <div className="flex items-baseline justify-between gap-3">
              <StepHeading id="items-heading" step={2} title="Add products" />
              <p className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
                {itemCount} of {box.capacity} added
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {GIFT_ITEMS.map((item) => (
                <GiftItemCard
                  key={item.id}
                  item={item}
                  quantity={config.items[item.id] ?? 0}
                  isFull={isFull}
                  logoUrl={logoUrl}
                />
              ))}
            </div>
            {isFull && (
              <p className="mt-3 text-sm text-gold-deep">
                This box is full. Remove a product or choose a larger box to add more.
              </p>
            )}
          </section>

          <section aria-labelledby="logo-heading">
            <StepHeading id="logo-heading" step={3} title="Add your logo" />
            <LogoUpload />
          </section>
        </div>

        {/* Flattened on phones so the preview leads the page and the summary follows the steps. */}
        <div className="contents lg:sticky lg:top-[calc(var(--header-h,160px)+1rem)] lg:block lg:min-w-0 lg:space-y-4">
          <GiftBoxPreviewPanel config={config} className="order-first min-w-0 lg:order-none" />

          <section aria-labelledby="summary-heading" className="rounded-2xl border bg-surface p-5 shadow-card">
            <h2 id="summary-heading" className="font-semibold text-ink">
              Your gift box
            </h2>
            <ul className="mt-3 divide-y text-sm">
              <li className="flex items-center justify-between gap-3 py-2">
                <span className="text-ink">{box.name}</span>
                <span className="tabular-nums text-ink">{formatBDT(box.price)}</span>
              </li>
              {lines.map(({ item, quantity, total: lineTotal }) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate text-ink">{item.name}</span>
                  <span className="ml-auto flex shrink-0 items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={`Remove one ${item.name}`}
                      onClick={() => changeGiftItemQuantity(item.id, -1)}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-6 text-center tabular-nums">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isFull}
                      aria-label={`Add one ${item.name}`}
                      onClick={() => changeGiftItemQuantity(item.id, 1)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                  <span className="w-16 shrink-0 text-right tabular-nums text-ink">{formatBDT(lineTotal)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-baseline justify-between border-t pt-3">
              <span className="font-semibold text-ink">Total</span>
              <span className="text-2xl font-bold text-teal tabular-nums" aria-live="polite">
                {formatBDT(total)}
              </span>
            </div>
            <button
              type="button"
              disabled={itemCount === 0}
              onClick={() => router.push("/gift-box/checkout")}
              className="pg-btn pg-btn-teal mt-5 w-full disabled:pointer-events-none disabled:opacity-50"
            >
              Proceed to checkout <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
            {itemCount === 0 && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Add at least one product to continue.
              </p>
            )}
            <Link href="/#catalog" className="pg-btn pg-btn-line mt-4 w-full">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Continue shopping
            </Link>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Your box stays saved while you browse.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

interface GiftItemCardProps {
  item: GiftItem;
  quantity: number;
  isFull: boolean;
  logoUrl?: string;
}

function GiftItemCard({ item, quantity, isFull, logoUrl }: GiftItemCardProps) {
  const addRef = React.useRef<HTMLButtonElement>(null);

  const removeOne = () => {
    // The minus button disappears at zero, so keyboard focus moves to the add button.
    // flushSync first: the add button is still disabled until a full box has re-rendered.
    flushSync(() => changeGiftItemQuantity(item.id, -1));
    if (quantity === 1) addRef.current?.focus();
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border-2 bg-surface p-3 transition",
        quantity > 0 ? "border-teal" : "border-border",
        !isFull && "hover:border-teal",
      )}
    >
      <button
        type="button"
        disabled={isFull}
        onClick={() => changeGiftItemQuantity(item.id, 1)}
        aria-label={`Add ${item.name}, ${formatBDT(item.price)}. ${quantity} in box.`}
        className={cn(
          "flex flex-1 flex-col justify-start rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isFull && "cursor-not-allowed opacity-60",
        )}
      >
        <span className="block aspect-square rounded-lg bg-surface-tint/60 p-2">
          <GiftItemThumbnail id={item.id} logoUrl={logoUrl} />
        </span>
        <span className="mt-2 block font-semibold text-ink">{item.name}</span>
        <span className="block text-xs text-muted-foreground">{item.description}</span>
      </button>
      {/* Outside the disabled area: a full box must still let customers take items out. */}
      <div className="mt-2 space-y-1.5">
        <span className="block font-semibold text-teal">{formatBDT(item.price)}</span>
        {/* Own row, so the card keeps its layout as the minus button comes and goes. */}
        <span className="flex items-center justify-end gap-1">
          {quantity > 0 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label={`Remove one ${item.name}`}
                onClick={removeOne}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-6 text-center text-sm tabular-nums">{quantity}</span>
            </>
          )}
          <Button
            ref={addRef}
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={isFull}
            aria-label={`Add one ${item.name}`}
            onClick={() => changeGiftItemQuantity(item.id, 1)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </span>
      </div>
    </div>
  );
}

function StepHeading({ id, step, title }: { id: string; step: number; title: string }) {
  return (
    <h2 id={id} className="flex items-center gap-2 text-lg font-semibold text-ink">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-sm font-bold">
        {step}
      </span>
      {title}
    </h2>
  );
}

function LogoUpload() {
  const { logo } = useGiftBoxConfig();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const readerRef = React.useRef<FileReader | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload a PNG, SVG, JPG or WebP file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("File is larger than 2 MB.");
      return;
    }
    setError(null);

    // A newer pick replaces a read still in progress, so the last file chosen always wins.
    readerRef.current?.abort();
    const reader = new FileReader();
    readerRef.current = reader;
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setGiftBoxLogo({ dataUrl: reader.result, fileName: file.name });
      }
    };
    reader.onerror = () => setError("We couldn't read that file. Please try another.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="mt-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        aria-label="Upload logo"
        className="sr-only"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {logo ? (
        <div className="flex items-center gap-3 rounded-xl border bg-surface p-3">
          {/* A local data URL, which next/image cannot optimise. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo.dataUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg bg-surface-tint object-contain p-1" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink" title={logo.fileName}>
            {logo.fileName}
          </span>
          <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>
            Replace
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Remove logo"
            className="h-9 w-9 text-muted-foreground hover:text-ink"
            onClick={() => setGiftBoxLogo(null)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-surface px-4 py-6 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            dragging ? "border-teal bg-surface-tint" : "border-border hover:border-teal",
          )}
        >
          <ImageUp className="h-6 w-6 text-teal" aria-hidden />
          <span className="text-sm font-medium text-ink">Click or drop your logo here</span>
          <span className="text-xs text-muted-foreground">
            PNG with transparent background works best · max 2 MB
          </span>
        </button>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
