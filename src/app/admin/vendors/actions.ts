"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/admin/auth";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, type ActionState } from "@/lib/admin/form-state";
import { VENDOR_IMAGES_BUCKET } from "@/lib/supabase/config";
import { parseAdminVendorForm } from "@/lib/vendor/input";

/** Turns a vendor's access on or off. A disabled vendor can't sign in or upload. */
export async function setVendorActive(formData: FormData): Promise<void> {
  const admin = await getAdminSession();
  if (!admin) return;

  const id = formData.get("id");
  const active = formData.get("active") === "true";
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return;

  const { error } = await admin.supabase.from("vendors").update({ is_active: active }).eq("id", id);
  if (error) console.error("[admin] Couldn't update vendor:", error.message);

  revalidatePath("/admin/vendors", "layout");
}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const TAKEN_ERRORS = {
  whatsapp_taken: { whatsapp: "A vendor with this WhatsApp number already exists." },
  email_taken: { email: "Another vendor already uses this email." },
} as const;

/**
 * Creates a vendor account directly: no email code. The vendor signs in at /vendor
 * with the WhatsApp number and the password set here. An email entered here counts
 * as verified, so password-reset and password-change codes go to it.
 */
export async function createVendorByAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getAdminSession();
  if (!admin) return { status: "error", message: "Your admin session has expired. Sign in again." };

  const parsed = parseAdminVendorForm(formData);
  const fieldErrors = parsed.ok ? {} : { ...parsed.fieldErrors };

  const logoEntry = formData.get("logo");
  let logo: File | null = null;
  if (logoEntry instanceof File && logoEntry.size > 0) {
    if (!ACCEPTED_IMAGE_TYPES.includes(logoEntry.type)) fieldErrors.logo = "Use JPG, PNG, WebP or AVIF.";
    else if (logoEntry.size > MAX_IMAGE_BYTES) fieldErrors.logo = "Logo is larger than 4 MB.";
    else logo = logoEntry;
  }

  if (!parsed.ok || Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  const { data, error } = await admin.supabase
    .rpc("pro_gift_admin_create_vendor", {
      p_business_name: parsed.data.business_name,
      p_whatsapp: parsed.data.whatsapp,
      p_email: parsed.data.email,
      p_address: parsed.data.address,
      p_description: parsed.data.description,
      p_password: parsed.data.password,
      p_with_logo_ticket: logo !== null,
    })
    .single<{ status: string; vendor_id: string | null; vendor_code: string | null; upload_ticket: string | null }>();
  if (error || !data) {
    console.error("[admin] Create vendor failed:", error?.message ?? "no row");
    return {
      status: "error",
      message:
        error?.code === "PGRST202"
          ? "The database isn't updated for this yet. Run the latest vendor migration in Supabase."
          : (error?.message ?? "The vendor couldn't be created. Please try again."),
    };
  }

  if (data.status === "whatsapp_taken" || data.status === "email_taken") {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: TAKEN_ERRORS[data.status] };
  }
  if (data.status !== "ok" || !data.vendor_id) {
    return { status: "error", message: "The vendor couldn't be created. Please try again." };
  }

  // The vendor exists now; a logo problem shouldn't undo it.
  let logoNote = "";
  if (logo && data.upload_ticket) {
    const path = `${data.upload_ticket}/${randomUUID()}.${EXTENSIONS[logo.type]}`;
    const { error: uploadError } = await admin.supabase.storage
      .from(VENDOR_IMAGES_BUCKET)
      .upload(path, logo, { contentType: logo.type, cacheControl: "31536000", upsert: false });
    const { error: saveError } = uploadError
      ? { error: uploadError }
      : await admin.supabase.from("vendors").update({ logo_path: path }).eq("id", data.vendor_id);
    if (uploadError || saveError) {
      console.error("[admin] Vendor logo couldn't be saved:", (uploadError ?? saveError)?.message);
      logoNote = "&logo=failed";
    }
  }

  revalidatePath("/admin/vendors", "layout");
  redirect(`/admin/vendors/${data.vendor_id}?created=1${logoNote}`);
}
