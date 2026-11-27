import "server-only";

import type { ProductSpec } from "@/types/product";
import { MAX_IMAGES } from "@/lib/admin/form-state";
import type { VendorStoredImage } from "./types";
import { normalizeWhatsAppNumber } from "./whatsapp";

type FieldErrors = Partial<Record<string, string>>;

/** Storage path written by uploadVendorImage: <ticket uuid>/<file uuid>.<ext> */
export const VENDOR_IMAGE_PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp|avif)$/;
export const VENDOR_CODE = /^PGV-[A-Z0-9]{6}$/;
export const OTP_CODE = /^\d{6}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function wholeNumber(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n <= 2_000_000_000 ? n : null;
}

function parseJsonArray(raw: string): unknown[] | null {
  try {
    const parsed: unknown = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export interface VendorProfileInput {
  business_name: string;
  address: string;
  whatsapp: string;
  email: string;
  description: string;
  logo_path: string | null;
}

export function parseEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL.test(email) ? email : null;
}

/** Sign-in ID: a WhatsApp number in any common format, or an older PGV-XXXXXX code. */
export function parseVendorLogin(value: string): string | null {
  const trimmed = value.trim();
  if (VENDOR_CODE.test(trimmed.toUpperCase())) return trimmed.toUpperCase();
  return normalizeWhatsAppNumber(trimmed);
}

export function parseRequestId(formData: FormData): string | null {
  const value = text(formData, "request_id");
  return UUID.test(value) ? value : null;
}

export function parseOtpCode(formData: FormData): string | null {
  const value = text(formData, "otp").replace(/\s+/g, "");
  return OTP_CODE.test(value) ? value : null;
}

/** Fields shared by the enlistment form and the profile editor. */
export function parseVendorProfileForm(
  formData: FormData,
): { ok: true; data: VendorProfileInput } | { ok: false; fieldErrors: FieldErrors } {
  const fieldErrors: FieldErrors = {};

  const business_name = text(formData, "business_name");
  if (business_name.length < 2 || business_name.length > 120) {
    fieldErrors.business_name = "Business name must be 2–120 characters.";
  }

  const address = text(formData, "address");
  if (!address) fieldErrors.address = "Add your business address.";
  else if (address.length > 300) fieldErrors.address = "Keep the address under 300 characters.";

  const whatsapp = normalizeWhatsAppNumber(text(formData, "whatsapp"));
  if (!whatsapp) fieldErrors.whatsapp = "Enter a WhatsApp number, e.g. 01712-345678 or +8801712345678.";

  const email = parseEmail(text(formData, "email"));
  if (!email) fieldErrors.email = "Enter your email address, e.g. name@company.com.";

  const description = text(formData, "description");
  if (description.length > 2000) fieldErrors.description = "Keep the details under 2000 characters.";

  const logo = text(formData, "logo_path");
  if (logo && !VENDOR_IMAGE_PATH.test(logo)) fieldErrors.logo_path = "Logo couldn't be read. Upload it again.";

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return {
    ok: true,
    data: { business_name, address, whatsapp: whatsapp!, email: email!, description, logo_path: logo || null },
  };
}

export interface AdminVendorInput {
  business_name: string;
  whatsapp: string;
  /** Empty when the admin leaves it out. */
  email: string;
  address: string;
  description: string;
  password: string;
}

/** Admin "Create vendor" form. Email, address and details are optional; no email code is sent. */
export function parseAdminVendorForm(
  formData: FormData,
): { ok: true; data: AdminVendorInput } | { ok: false; fieldErrors: FieldErrors } {
  const fieldErrors: FieldErrors = {};

  const business_name = text(formData, "business_name");
  if (business_name.length < 2 || business_name.length > 120) {
    fieldErrors.business_name = "Business name must be 2–120 characters.";
  }

  const whatsapp = normalizeWhatsAppNumber(text(formData, "whatsapp"));
  if (!whatsapp) fieldErrors.whatsapp = "Enter a WhatsApp number, e.g. 01712-345678 or +8801712345678.";

  const rawEmail = text(formData, "email");
  const email = rawEmail ? parseEmail(rawEmail) : "";
  if (email === null) fieldErrors.email = "Enter a valid email address, or leave it empty.";

  const address = text(formData, "address");
  if (address.length > 300) fieldErrors.address = "Keep the address under 300 characters.";

  const description = text(formData, "description");
  if (description.length > 2000) fieldErrors.description = "Keep the details under 2000 characters.";

  const password = parsePassword(formData);
  if (!password) fieldErrors.password = "Use 8–72 characters.";
  else if (formData.get("password_confirm") !== password) fieldErrors.password_confirm = "Passwords don't match.";

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return {
    ok: true,
    data: { business_name, whatsapp: whatsapp!, email: email!, address, description, password: password! },
  };
}

export function parsePassword(formData: FormData, key = "password"): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.length >= 8 && value.length <= 72 ? value : null;
}

export interface VendorProductInput {
  name: string;
  code: string | null;
  description: string;
  price_min: number;
  price_max: number;
  moq: number;
  specs: ProductSpec[];
  images: VendorStoredImage[];
}

function parseSpecs(raw: string): ProductSpec[] | null {
  const items = parseJsonArray(raw);
  if (!items) return null;
  const specs: ProductSpec[] = [];
  for (const item of items) {
    if (typeof item !== "object" || item === null) return null;
    const { label, value } = item as Record<string, unknown>;
    if (typeof label !== "string" || typeof value !== "string") return null;
    const l = label.trim().slice(0, 60);
    const v = value.trim().slice(0, 160);
    if (l && v) specs.push({ label: l, value: v });
  }
  return specs;
}

/** The uploader sends { src, alt, path }; only the path is trusted and stored. */
function parseImages(raw: string): VendorStoredImage[] | null {
  const items = parseJsonArray(raw);
  if (!items) return null;
  const images: VendorStoredImage[] = [];
  for (const item of items) {
    if (typeof item !== "object" || item === null) return null;
    const { alt, path } = item as Record<string, unknown>;
    if (typeof path !== "string" || !VENDOR_IMAGE_PATH.test(path)) return null;
    images.push({ path, alt: typeof alt === "string" ? alt.trim().slice(0, 160) : "" });
  }
  return images;
}

export function parseVendorProductForm(
  formData: FormData,
): { ok: true; data: VendorProductInput } | { ok: false; fieldErrors: FieldErrors } {
  const fieldErrors: FieldErrors = {};

  const name = text(formData, "name");
  if (name.length < 2 || name.length > 120) fieldErrors.name = "Name must be 2–120 characters.";

  const code = text(formData, "code").toUpperCase().replace(/\s+/g, "-");
  if (code && !/^[A-Z0-9-]{2,32}$/.test(code)) {
    fieldErrors.code = "Use 2–32 letters, numbers or dashes, or leave it empty.";
  }

  const description = text(formData, "description");
  if (description.length > 4000) fieldErrors.description = "Keep the description under 4000 characters.";

  const min = wholeNumber(text(formData, "price_min"));
  const max = wholeNumber(text(formData, "price_max"));
  if (min === null) fieldErrors.price_min = "Enter a whole taka amount.";
  if (max === null) fieldErrors.price_max = "Enter a whole taka amount.";
  if (min !== null && max !== null && max < min) fieldErrors.price_max = "Max must be at least the min price.";

  const moq = wholeNumber(text(formData, "moq") || "1");
  if (moq === null || moq < 1) fieldErrors.moq = "Minimum order must be at least 1.";

  const specs = parseSpecs(text(formData, "specs"));
  if (!specs) fieldErrors.specs = "Specifications couldn't be read. Reload and try again.";
  else if (specs.length > 20) fieldErrors.specs = "Up to 20 specification rows.";

  const images = parseImages(text(formData, "images"));
  if (!images) fieldErrors.images = "Images couldn't be read. Reload and try again.";
  else if (images.length === 0) fieldErrors.images = "Add at least one photo.";
  else if (images.length > MAX_IMAGES) fieldErrors.images = `Up to ${MAX_IMAGES} photos.`;

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return {
    ok: true,
    data: {
      name,
      code: code || null,
      description,
      price_min: min!,
      price_max: max!,
      moq: moq!,
      specs: specs!,
      images: images!,
    },
  };
}
