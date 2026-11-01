import type { Product, ProductCategory, ProductImage } from "@/types/product";

export type GiftBoxId = "classic" | "premium" | "executive";

export interface GiftBox {
  id: GiftBoxId;
  name: string;
  description: string;
  /** Price of the empty box in taka. */
  price: number;
  /** Most items the box can hold. */
  capacity: number;
  /** Width of the box in the preview's SVG units. */
  previewWidth: number;
  wallColor: string;
  accentColor: string;
}

/** A catalogue product as the builder uses it. */
export interface GiftItem {
  /** The product's database id. */
  id: string;
  code: string;
  name: string;
  description: string;
  /** Starting price per piece in taka: the product's minimum. */
  price: number;
  moq: number;
  image: ProductImage;
}

export interface GiftBoxLogo {
  /** Data URL produced by FileReader. Stays in the browser. */
  dataUrl: string;
  fileName: string;
}

export interface GiftBoxConfig {
  boxId: GiftBoxId;
  /** Quantity per product id. Prices are never stored, so they always come from the catalogue. */
  items: Record<string, number>;
  logo: GiftBoxLogo | null;
}

export const GIFT_BOXES: readonly GiftBox[] = [
  {
    id: "classic",
    name: "Classic Box",
    description: "Compact box for a small thank-you set.",
    price: 350,
    capacity: 3,
    previewWidth: 320,
    wallColor: "var(--color-teal)",
    accentColor: "var(--color-gold)",
  },
  {
    id: "premium",
    name: "Premium Box",
    description: "Rigid box with room for a fuller set.",
    price: 650,
    capacity: 4,
    previewWidth: 400,
    wallColor: "var(--color-ink)",
    accentColor: "var(--color-gold)",
  },
  {
    id: "executive",
    name: "Executive Box",
    description: "Our largest box for complete executive sets.",
    price: 950,
    capacity: 5,
    previewWidth: 480,
    wallColor: "var(--color-gold-deep)",
    accentColor: "var(--color-ink)",
  },
];

export const DEFAULT_GIFT_BOX_CONFIG: GiftBoxConfig = {
  boxId: "classic",
  items: {},
  logo: null,
};

const PACKAGING_CATEGORY = /box(es)?\b|packaging/i;

/** Boxes and outer packaging can't go inside a gift box. Matched by text so new categories are covered too. */
export function isPackagingCategory({ slug, name }: ProductCategory): boolean {
  return PACKAGING_CATEGORY.test(slug) || PACKAGING_CATEGORY.test(name);
}

export function productToGiftItem(product: Product): GiftItem {
  return {
    id: product.id ?? product.slug,
    code: product.code,
    name: product.name,
    description: product.shortDescription,
    price: product.priceRange.min,
    moq: product.moq,
    image: product.images[0],
  };
}

export function getGiftBox(id: GiftBoxId): GiftBox {
  return GIFT_BOXES.find((box) => box.id === id) ?? GIFT_BOXES[0];
}

/** Browser storage and share links are user-editable, so unknown boxes and impossible quantities are dropped. */
export function normalizeGiftBoxSelection(
  value: { boxId?: unknown; items?: Record<string, unknown> } | null,
): Pick<GiftBoxConfig, "boxId" | "items"> {
  const box = GIFT_BOXES.find((candidate) => candidate.id === value?.boxId) ?? GIFT_BOXES[0];

  const items: GiftBoxConfig["items"] = {};
  let remaining = box.capacity;
  for (const [id, quantity] of Object.entries(value?.items ?? {})) {
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) continue;
    const allowed = Math.min(quantity, remaining);
    if (allowed > 0) items[id] = allowed;
    remaining -= allowed;
  }
  return { boxId: box.id, items };
}

export function countGiftItems(items: GiftBoxConfig["items"]): number {
  return Object.values(items).reduce((count, quantity) => count + quantity, 0);
}

/** Always priced from the current catalogue, so an edited browser store cannot change a total. */
export function summarizeGiftBox({ boxId, items }: GiftBoxConfig, catalogue: readonly GiftItem[]) {
  const box = getGiftBox(boxId);
  const lines = catalogue
    .filter((item) => (items[item.id] ?? 0) > 0)
    .map((item) => {
      const quantity = items[item.id] ?? 0;
      return { item, quantity, total: item.price * quantity };
    });
  return {
    box,
    lines,
    itemCount: lines.reduce((count, line) => count + line.quantity, 0),
    total: box.price + lines.reduce((sum, line) => sum + line.total, 0),
  };
}
