const CODE_BRAND = "PG";
const MAX_PREFIX_LENGTH = 4;
const MAX_SLUG_LENGTH = 6;
const FALLBACK_PREFIX = "GEN";

/** Hand-picked prefixes for known categories, keyed by category slug. */
const CATEGORY_PREFIXES: Record<string, string> = {
  "handcrafted-leather": "LTHR",
  "tech-electronic": "TECH",
  "executive-desk-organizers": "DESK",
  "awards-crests": "AWRD",
  "luxury-boxes": "BOX",
  "promotional-items": "PROM",
};

/** Text after one of these describes the product rather than naming it: "Mug with Lid" is a mug. */
const NAME_CONNECTORS = new Set(["WITH", "FOR", "AND", "OF", "IN", "ON", "BY"]);
const UNITS = new Set(["W", "V", "G", "KG", "L", "ML", "MM", "CM", "M", "MB", "GB", "TB", "PC", "PCS"]);

/** Uppercase A–Z words, with accents folded and anything containing a digit dropped. */
function words(value: string): string[] {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((word) => /^[A-Z]+$/.test(word));
}

/** "Promotional Items" -> PROM. Categories without a mapping use their first word's opening letters. */
export function categoryCodePrefix(category: { slug: string; name: string }): string {
  const mapped = CATEGORY_PREFIXES[category.slug];
  if (mapped) return mapped;
  const [first] = words(category.name);
  return first ? first.slice(0, MAX_PREFIX_LENGTH) : FALLBACK_PREFIX;
}

/** The word naming the product, usually the last: "Leather Business Card Holder" -> HOLDER. */
export function productNameSlug(name: string): string {
  const all = words(name);
  const connector = all.findIndex((word) => NAME_CONNECTORS.has(word));
  const naming = (connector > 0 ? all.slice(0, connector) : all).filter((word) => !UNITS.has(word));
  return (naming.at(-1) ?? "").slice(0, MAX_SLUG_LENGTH);
}

function numbered(base: string, number: number): string {
  return `${base}-${String(number).padStart(2, "0")}`;
}

/**
 * Builds a code that isn't in `existingCodes`, e.g. PG-LTHR-HOLDER, then PG-LTHR-HOLDER-02.
 * Names with no usable letters (or no name yet) get the category's next number: PG-LTHR-01.
 */
export function generateProductCode(
  category: { slug: string; name: string },
  productName: string,
  existingCodes: readonly string[],
): string {
  const taken = new Set(existingCodes.map((code) => code.toUpperCase()));
  const base = `${CODE_BRAND}-${categoryCodePrefix(category)}`;
  const slug = productNameSlug(productName);

  if (slug) {
    const code = `${base}-${slug}`;
    if (!taken.has(code)) return code;
    let number = 2;
    while (taken.has(numbered(code, number))) number += 1;
    return numbered(code, number);
  }

  let number = 1;
  while (taken.has(numbered(base, number))) number += 1;
  return numbered(base, number);
}
