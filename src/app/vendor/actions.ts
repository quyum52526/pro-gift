"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, type ActionState, type UploadResult } from "@/lib/admin/form-state";
import { createPublicClient } from "@/lib/supabase/server";
import { VENDOR_IMAGES_BUCKET } from "@/lib/supabase/config";
import { parsePassword, parseVendorProductForm, parseVendorProfileForm, VENDOR_CODE } from "@/lib/vendor/input";
import {
  clearVendorCookie,
  getVendorToken,
  setVendorCookie,
  VENDOR_HOME_PATH,
} from "@/lib/vendor/session";
import { vendorImageUrl } from "@/lib/vendor/types";

const SIGNED_OUT: ActionState = {
  status: "error",
  message: "Your vendor session has expired. Sign in again.",
};

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function checkImage(file: FormDataEntryValue | null): File | string {
  if (!(file instanceof File) || file.size === 0) return "No file received.";
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return "Use JPG, PNG, WebP or AVIF.";
  if (file.size > MAX_IMAGE_BYTES) return "Image is larger than 4 MB.";
  return file;
}

/** Gets a one-time upload folder for this vendor, then stores the file in it. */
async function storeImage(token: string, file: File): Promise<{ path: string } | { error: string }> {
  const supabase = createPublicClient();
  const { data: ticket, error: ticketError } = await supabase.rpc("pro_gift_vendor_issue_upload_ticket", {
    p_token: token,
  });
  if (ticketError) return { error: ticketError.message };
  if (typeof ticket !== "string") return { error: SIGNED_OUT.message! };

  const path = `${ticket}/${randomUUID()}.${EXTENSIONS[file.type]}`;
  const { error } = await supabase.storage
    .from(VENDOR_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  return error ? { error: error.message } : { path };
}

function refreshVendorPages() {
  revalidatePath(VENDOR_HOME_PATH, "layout");
  revalidatePath("/admin/vendors", "layout");
}

// ---------------------------------------------------------------- account

export async function registerVendor(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseVendorProfileForm(formData);
  const password = parsePassword(formData);
  const fieldErrors = parsed.ok ? {} : { ...parsed.fieldErrors };
  if (!password) fieldErrors.password = "Use 8–72 characters.";
  else if (formData.get("password_confirm") !== password) fieldErrors.password_confirm = "Passwords don't match.";

  const logoEntry = formData.get("logo");
  const hasLogo = logoEntry instanceof File && logoEntry.size > 0;
  const logo = hasLogo ? checkImage(logoEntry) : null;
  if (typeof logo === "string") fieldErrors.logo = logo;

  if (!parsed.ok || Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .rpc("pro_gift_vendor_register", {
      p_business_name: parsed.data.business_name,
      p_address: parsed.data.address,
      p_whatsapp: parsed.data.whatsapp,
      p_description: parsed.data.description,
      p_password: password,
    })
    .single<{ vendor_code: string; session_token: string }>();
  if (error || !data) {
    console.error("[vendor] Registration failed:", error?.message);
    return { status: "error", message: "We couldn't create your vendor profile. Please try again." };
  }
  await setVendorCookie(data.session_token);

  // The profile exists now; a logo problem shouldn't undo the enlistment.
  let logoNote = "";
  if (logo instanceof File) {
    const stored = await storeImage(data.session_token, logo);
    const saved =
      "path" in stored &&
      !(
        await supabase.rpc("pro_gift_vendor_update_profile", {
          p_token: data.session_token,
          p_business_name: parsed.data.business_name,
          p_address: parsed.data.address,
          p_whatsapp: parsed.data.whatsapp,
          p_description: parsed.data.description,
          p_logo_path: stored.path,
        })
      ).error;
    if (!saved) logoNote = "&logo=failed";
  }

  refreshVendorPages();
  redirect(`${VENDOR_HOME_PATH}?welcome=1${logoNote}`);
}

export async function signInVendor(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const password = String(formData.get("password") ?? "");
  if (!VENDOR_CODE.test(code) || !password) {
    return { status: "error", message: "Enter your vendor ID (PGV-XXXXXX) and password." };
  }

  const { data: token, error } = await createPublicClient().rpc("pro_gift_vendor_login", {
    p_code: code,
    p_password: password,
  });
  // One message for every failure, so the form doesn't reveal which IDs exist.
  if (error || typeof token !== "string") {
    if (error) console.error("[vendor] Sign-in failed:", error.message);
    return {
      status: "error",
      message: "Vendor ID or password is incorrect. After 5 wrong tries, sign-in pauses for 15 minutes.",
    };
  }

  await setVendorCookie(token);
  refreshVendorPages();
  redirect(VENDOR_HOME_PATH);
}

export async function signOutVendor(): Promise<void> {
  const token = await getVendorToken();
  if (token) await createPublicClient().rpc("pro_gift_vendor_logout", { p_token: token });
  await clearVendorCookie();
  refreshVendorPages();
  redirect(VENDOR_HOME_PATH);
}

export async function updateVendorProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = await getVendorToken();
  if (!token) return SIGNED_OUT;

  const parsed = parseVendorProfileForm(formData);
  if (!parsed.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: parsed.fieldErrors };
  }

  const { data, error } = await createPublicClient().rpc("pro_gift_vendor_update_profile", {
    p_token: token,
    p_business_name: parsed.data.business_name,
    p_address: parsed.data.address,
    p_whatsapp: parsed.data.whatsapp,
    p_description: parsed.data.description,
    p_logo_path: parsed.data.logo_path,
  });
  if (error) return { status: "error", message: error.message };
  if (data !== true) return SIGNED_OUT;

  refreshVendorPages();
  redirect(`${VENDOR_HOME_PATH}?saved=profile`);
}

export async function changeVendorPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = await getVendorToken();
  if (!token) return SIGNED_OUT;

  const current = String(formData.get("current_password") ?? "");
  const next = parsePassword(formData, "new_password");
  if (!next) return { status: "error", fieldErrors: { new_password: "Use 8–72 characters." } };
  if (formData.get("new_password_confirm") !== next) {
    return { status: "error", fieldErrors: { new_password_confirm: "Passwords don't match." } };
  }

  const { data, error } = await createPublicClient().rpc("pro_gift_vendor_change_password", {
    p_token: token,
    p_current_password: current,
    p_new_password: next,
  });
  if (error) return { status: "error", message: error.message };
  if (data !== true) return { status: "error", fieldErrors: { current_password: "Current password is incorrect." } };
  return { status: "success", message: "Password changed. Other devices were signed out." };
}

// ---------------------------------------------------------------- images

/** Uploads one image. Called once per file so each request stays small. */
export async function uploadVendorImage(formData: FormData): Promise<UploadResult> {
  const token = await getVendorToken();
  if (!token) return { ok: false, error: SIGNED_OUT.message! };

  const file = checkImage(formData.get("file"));
  if (typeof file === "string") return { ok: false, error: file };

  const stored = await storeImage(token, file);
  if ("error" in stored) return { ok: false, error: stored.error };
  return { ok: true, image: { src: vendorImageUrl(stored.path), path: stored.path } };
}

// ---------------------------------------------------------------- products

export async function saveVendorProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = await getVendorToken();
  if (!token) return SIGNED_OUT;

  const parsed = parseVendorProductForm(formData);
  if (!parsed.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: parsed.fieldErrors };
  }
  const id = formData.get("id");
  const productId = typeof id === "string" && id ? id : null;

  const { data, error } = await createPublicClient().rpc("pro_gift_vendor_save_product", {
    p_token: token,
    p_product_id: productId,
    p_name: parsed.data.name,
    p_code: parsed.data.code,
    p_description: parsed.data.description,
    p_price_min: parsed.data.price_min,
    p_price_max: parsed.data.price_max,
    p_moq: parsed.data.moq,
    p_specs: parsed.data.specs,
    p_images: parsed.data.images,
  });
  if (error) return error.code === "28000" ? SIGNED_OUT : { status: "error", message: error.message };

  refreshVendorPages();
  redirect(`${VENDOR_HOME_PATH}?saved=product#product-${String(data)}`);
}

export async function deleteVendorProduct(formData: FormData): Promise<void> {
  const token = await getVendorToken();
  const id = formData.get("id");
  if (!token || typeof id !== "string") redirect(VENDOR_HOME_PATH);

  await createPublicClient().rpc("pro_gift_vendor_delete_product", { p_token: token, p_product_id: id });
  refreshVendorPages();
  redirect(`${VENDOR_HOME_PATH}?saved=deleted`);
}
