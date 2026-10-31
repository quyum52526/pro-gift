export type GiftBoxId = "classic" | "premium" | "executive";
export type GiftItemId = "mug" | "bottle" | "pen" | "notebook";

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

export interface GiftItem {
  id: GiftItemId;
  name: string;
  description: string;
  /** Price per piece in taka. */
  price: number;
}

export interface GiftBoxLogo {
  /** Data URL produced by FileReader. Stays in the browser. */
  dataUrl: string;
  fileName: string;
}

export interface GiftBoxConfig {
  boxId: GiftBoxId;
  items: Partial<Record<GiftItemId, number>>;
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

export const GIFT_ITEMS: readonly GiftItem[] = [
  { id: "mug", name: "Mug", description: "Ceramic, 350 ml", price: 450 },
  { id: "bottle", name: "Bottle", description: "Steel, 500 ml", price: 750 },
  { id: "pen", name: "Pen", description: "Metal ballpoint", price: 150 },
  { id: "notebook", name: "Notebook", description: "A5 hardcover", price: 400 },
];

export const DEFAULT_GIFT_BOX_CONFIG: GiftBoxConfig = {
  boxId: "classic",
  items: {},
  logo: null,
};

export function getGiftBox(id: GiftBoxId): GiftBox {
  return GIFT_BOXES.find((box) => box.id === id) ?? GIFT_BOXES[0];
}

export function countGiftItems(items: GiftBoxConfig["items"]): number {
  return GIFT_ITEMS.reduce((count, item) => count + (items[item.id] ?? 0), 0);
}

/** Always priced from this catalogue, so an edited browser store cannot change a total. */
export function summarizeGiftBox({ boxId, items }: GiftBoxConfig) {
  const box = getGiftBox(boxId);
  const lines = GIFT_ITEMS.filter((item) => (items[item.id] ?? 0) > 0).map((item) => {
    const quantity = items[item.id] ?? 0;
    return { item, quantity, total: item.price * quantity };
  });
  return {
    box,
    lines,
    itemCount: countGiftItems(items),
    total: box.price + lines.reduce((sum, line) => sum + line.total, 0),
  };
}
