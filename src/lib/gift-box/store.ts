import { useSyncExternalStore } from "react";

import {
  DEFAULT_GIFT_BOX_CONFIG,
  GIFT_BOXES,
  GIFT_ITEMS,
  countGiftItems,
  getGiftBox,
  type GiftBoxConfig,
  type GiftBoxId,
  type GiftBoxLogo,
  type GiftItemId,
} from "./catalog";

const CONFIG_KEY = "pro-gift:gift-box";
const LOGO_KEY = "pro-gift:gift-box-logo";

let current = DEFAULT_GIFT_BOX_CONFIG;
let loaded = false;
const listeners = new Set<() => void>();

function parseLogo(raw: string | null): GiftBoxLogo | null {
  if (!raw) return null;
  const value: unknown = JSON.parse(raw);
  if (typeof value !== "object" || value === null) return null;
  const { dataUrl, fileName } = value as Record<string, unknown>;
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) return null;
  return { dataUrl, fileName: typeof fileName === "string" ? fileName : "logo" };
}

/** Storage is user-editable, so unknown boxes and impossible quantities are dropped. */
function parseConfig(raw: string | null, logo: GiftBoxLogo | null): GiftBoxConfig {
  if (!raw) return { ...DEFAULT_GIFT_BOX_CONFIG, logo };
  const value = JSON.parse(raw) as { boxId?: unknown; items?: Record<string, unknown> } | null;
  const box = GIFT_BOXES.find((candidate) => candidate.id === value?.boxId) ?? GIFT_BOXES[0];

  const items: GiftBoxConfig["items"] = {};
  let remaining = box.capacity;
  for (const { id } of GIFT_ITEMS) {
    const quantity = value?.items?.[id];
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) continue;
    const allowed = Math.min(quantity, remaining);
    if (allowed > 0) items[id] = allowed;
    remaining -= allowed;
  }
  return { boxId: box.id, items, logo };
}

function load(): GiftBoxConfig {
  try {
    const logo = parseLogo(sessionStorage.getItem(LOGO_KEY));
    return parseConfig(sessionStorage.getItem(CONFIG_KEY), logo);
  } catch {
    return DEFAULT_GIFT_BOX_CONFIG;
  }
}

function getSnapshot(): GiftBoxConfig {
  if (!loaded) {
    loaded = true;
    current = load();
  }
  return current;
}

function getServerSnapshot(): GiftBoxConfig {
  return DEFAULT_GIFT_BOX_CONFIG;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The module keeps the config across client navigation; storage only adds refresh survival. */
function persist(previous: GiftBoxConfig, next: GiftBoxConfig) {
  try {
    sessionStorage.setItem(CONFIG_KEY, JSON.stringify({ boxId: next.boxId, items: next.items }));
    // Logos are large, so they are only rewritten when they change.
    if (previous.logo !== next.logo) {
      if (next.logo) sessionStorage.setItem(LOGO_KEY, JSON.stringify(next.logo));
      else sessionStorage.removeItem(LOGO_KEY);
    }
  } catch {
    // Private mode or a full quota: the in-memory copy still reaches checkout.
  }
}

function update(next: GiftBoxConfig) {
  persist(current, next);
  current = next;
  listeners.forEach((listener) => listener());
}

export function selectGiftBox(boxId: GiftBoxId) {
  const config = getSnapshot();
  if (countGiftItems(config.items) > getGiftBox(boxId).capacity) return;
  update({ ...config, boxId });
}

export function changeGiftItemQuantity(id: GiftItemId, delta: number) {
  const config = getSnapshot();
  const room = getGiftBox(config.boxId).capacity - countGiftItems(config.items);
  if (delta > room) return;

  const quantity = (config.items[id] ?? 0) + delta;
  const items = { ...config.items };
  if (quantity > 0) items[id] = quantity;
  else delete items[id];
  update({ ...config, items });
}

export function setGiftBoxLogo(logo: GiftBoxLogo | null) {
  update({ ...getSnapshot(), logo });
}

export function useGiftBoxConfig(): GiftBoxConfig {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
