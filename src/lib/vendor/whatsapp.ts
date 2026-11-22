import { SITE_URL } from "@/lib/site";
import { formatPriceRange } from "@/lib/utils";
import type { VendorProduct, VendorProfile } from "./types";

/**
 * Turns what a vendor types into wa.me digits: "01712-345678" → "8801712345678",
 * "+880 1712 345678" → "8801712345678". Returns null when it can't be a phone number.
 */
export function normalizeWhatsAppNumber(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Local Bangladeshi mobile number (01XXXXXXXXX).
  if (/^01\d{9}$/.test(digits)) digits = `88${digits}`;
  return /^\d{10,15}$/.test(digits) ? digits : null;
}

/** "8801712345678" → "+880 1712-345678" for display; other countries are shown as +digits. */
export function formatWhatsAppNumber(digits: string): string {
  const bd = /^880(\d{4})(\d{6})$/.exec(digits);
  return bd ? `+880 ${bd[1]}-${bd[2]}` : `+${digits}`;
}

/** Where a vendor sees this product in their portal (they must be signed in). */
export function vendorProductPortalUrl(productId: string): string {
  return `${SITE_URL}/vendor#product-${productId}`;
}

/** Pro Gift → vendor price check for a client inquiry. */
export function buildVendorInquiryMessage(
  vendor: Pick<VendorProfile, "businessName">,
  product: Pick<VendorProduct, "id" | "name" | "code" | "priceRange" | "images">,
): string {
  const lines = [
    `Hello ${vendor.businessName}! This is Pro Gift. A client is asking about this product:`,
    "",
    `Product: ${product.name}`,
  ];
  if (product.code) lines.push(`Code: ${product.code}`);
  lines.push(`Your listed price: ${formatPriceRange(product.priceRange.min, product.priceRange.max)}`);
  lines.push(`Product link: ${vendorProductPortalUrl(product.id)}`);
  if (product.images[0]) lines.push(`Photo: ${product.images[0].src}`);
  lines.push("", "Could you confirm your current price, stock and delivery time? Thank you!");
  return lines.join("\n");
}

export function buildVendorWhatsAppUrl(
  vendor: Pick<VendorProfile, "businessName" | "whatsapp">,
  product: Pick<VendorProduct, "id" | "name" | "code" | "priceRange" | "images">,
): string {
  return `https://wa.me/${vendor.whatsapp}?text=${encodeURIComponent(buildVendorInquiryMessage(vendor, product))}`;
}

/** General chat with a vendor, from their profile header. */
export function buildVendorContactUrl(vendor: Pick<VendorProfile, "businessName" | "whatsapp">): string {
  const text = encodeURIComponent(`Hello ${vendor.businessName}! This is Pro Gift. Do you have a moment to discuss some products?`);
  return `https://wa.me/${vendor.whatsapp}?text=${text}`;
}
