import { normalizeGiftBoxSelection, type GiftBoxConfig } from "./catalog";

export const GIFT_BOX_VIEW_PATH = "/gift-box/view";
export const GIFT_BOX_CONFIG_PARAM = "config";

const MAX_LOGO_NAME_LENGTH = 100;
/** Far beyond any real box, so an oversized link is rejected before it is parsed. */
const MAX_ENCODED_LENGTH = 4000;

/** A box as carried by a share link. Logo files are too large for a URL, so only the name travels. */
export interface SharedGiftBox extends Pick<GiftBoxConfig, "boxId" | "items"> {
  logoName: string | null;
}

/** URL-safe base64 of the box. Prices are left out, so the view page always reads them from the catalogue. */
export function encodeGiftBoxConfig({ boxId, items, logo }: GiftBoxConfig): string {
  const json = JSON.stringify({ b: boxId, i: items, l: logo?.fileName.slice(0, MAX_LOGO_NAME_LENGTH) });
  const binary = Array.from(new TextEncoder().encode(json), (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Share links are user-editable, so anything unreadable returns null and values are re-validated. */
export function decodeGiftBoxConfig(encoded: string): SharedGiftBox | null {
  if (encoded.length > MAX_ENCODED_LENGTH) return null;
  try {
    const binary = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as {
      b?: unknown;
      i?: Record<string, unknown>;
      l?: unknown;
    } | null;
    return {
      ...normalizeGiftBoxSelection({ boxId: value?.b, items: value?.i }),
      logoName: typeof value?.l === "string" && value.l ? value.l.slice(0, MAX_LOGO_NAME_LENGTH) : null,
    };
  } catch {
    return null;
  }
}

export function buildGiftBoxViewUrl(origin: string, config: GiftBoxConfig): string {
  return `${origin}${GIFT_BOX_VIEW_PATH}?${GIFT_BOX_CONFIG_PARAM}=${encodeGiftBoxConfig(config)}`;
}
