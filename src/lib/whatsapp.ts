import type { Product } from "@/types/product";

/** Business number in international format, digits only (e.g. 8801XXXXXXXXX). */
export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "8801962434901").replace(
  /\D/g,
  "",
);

export interface InquiryOptions {
  quantity?: number;
  /** Absolute product URL, so the sales team can open the exact item. */
  productUrl?: string;
  /** The customer has previewed their logo and will send the file. */
  withLogo?: boolean;
}

export function buildInquiryMessage(
  product: Pick<Product, "name" | "code">,
  { quantity, productUrl, withLogo }: InquiryOptions = {},
): string {
  const lines = [
    "Hello Pro Gift! I'd like a quote for this product:",
    "",
    `Product: ${product.name}`,
    `Code: ${product.code}`,
  ];
  if (quantity) lines.push(`Quantity: ${quantity} pcs`);
  if (withLogo) lines.push("Branding: I'll share my logo file for a mockup.");
  if (productUrl) lines.push(`Link: ${productUrl}`);
  lines.push("", "Please share pricing and delivery time. Thank you!");
  return lines.join("\n");
}

/** General inquiry link for places without a specific product (header, footer). */
export function buildGeneralWhatsAppUrl(): string {
  const text = encodeURIComponent(
    "Hello Pro Gift! I'm looking for corporate gifts. Could you help me with options and pricing?",
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

/** Short one-line inquiry used by catalogue cards and the quick view. */
export function buildQuickInquiryUrl(product: Pick<Product, "name" | "code">): string {
  const text = encodeURIComponent(
    `Hi, I am interested in ${product.name} (Code: ${product.code}). Please share the quotation.`,
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export function buildWhatsAppUrl(
  product: Pick<Product, "name" | "code">,
  options?: InquiryOptions,
): string {
  const text = encodeURIComponent(buildInquiryMessage(product, options));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}
