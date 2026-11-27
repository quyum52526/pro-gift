"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, type ActionState, type UploadResult } from "@/lib/admin/form-state";
import { createPublicClient } from "@/lib/supabase/server";
import { VENDOR_IMAGES_BUCKET } from "@/lib/supabase/config";
import { getVendorServerSecret, OTP_SETUP_MISSING, sendVendorOtpEmail } from "@/lib/vendor/email";
import {
  parseEmail,
  parseOtpCode,
  parsePassword,
  parseRequestId,
  parseVendorLogin,
  parseVendorProductForm,
  parseVendorProfileForm,
  type VendorProfileInput,
} from "@/lib/vendor/input";
import type { OtpStartState } from "@/lib/vendor/otp-state";
import {
  clearVendorCookie,
  getVendorToken,
  setVendorCookie,
  VENDOR_HOME_PATH,
} from "@/lib/vendor/session";
import { vendorImageUrl, type VendorRow } from "@/lib/vendor/types";

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

type ProfileStatus = "ok" | "signed_out" | "whatsapp_taken" | "email_taken";

const TAKEN_ERRORS = {
  whatsapp_taken: {
    whatsapp: "This WhatsApp number already has a vendor account. Sign in, or use “Forgot password”.",
  },
  email_taken: { email: "This email is already used by another vendor account." },
} as const;

function profileArgs(token: string, profile: VendorProfileInput) {
  return {
    p_token: token,
    p_business_name: profile.business_name,
    p_address: profile.address,
    p_whatsapp: profile.whatsapp,
    p_email: profile.email,
    p_description: profile.description,
    p_logo_path: profile.logo_path,
  };
}

/** The database refuses code requests when VENDOR_SERVER_SECRET is missing or wrong. */
function otpSetupError(error: { code?: string; message: string }, where: string): string {
  console.error(`[vendor] ${where} failed:`, error.message);
  return error.code === "28000" ? OTP_SETUP_MISSING : "Something went wrong. Please try again.";
}

function codeSentMessage(target: string, devFallback: boolean): string {
  return devFallback
    ? "Development mode: Resend isn't configured, so the code was printed in the server console."
    : `We sent a 6-digit code to ${target}. It expires in 10 minutes.`;
}

/**
 * "Send new code" re-submits the step-1 form with the current request id, so
 * errors like "wait a minute" keep the code screen open.
 */
function stayOnCodeStep(prev: OtpStartState, formData: FormData): Partial<OtpStartState> {
  const requestId = parseRequestId(formData);
  return requestId ? { step: "code", requestId, email: prev.email } : {};
}

/** Enlist, step 1: check the details and email a 6-digit code. Nothing is created yet. */
export async function startVendorSignup(prev: OtpStartState, formData: FormData): Promise<OtpStartState> {
  const parsed = parseVendorProfileForm(formData);
  const password = parsePassword(formData);
  const fieldErrors = parsed.ok ? {} : { ...parsed.fieldErrors };
  if (!password) fieldErrors.password = "Use 8–72 characters.";
  else if (formData.get("password_confirm") !== password) fieldErrors.password_confirm = "Passwords don't match.";

  const logoEntry = formData.get("logo");
  if (logoEntry instanceof File && logoEntry.size > 0) {
    const logo = checkImage(logoEntry);
    if (typeof logo === "string") fieldErrors.logo = logo;
  }

  if (!parsed.ok || Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  const keep = stayOnCodeStep(prev, formData);
  const secret = getVendorServerSecret();
  if (!secret) {
    console.error("[vendor] VENDOR_SERVER_SECRET is not set; can't start vendor signup.");
    return { status: "error", message: OTP_SETUP_MISSING, ...keep };
  }

  const { data, error } = await createPublicClient()
    .rpc("pro_gift_vendor_signup_start", {
      p_secret: secret,
      p_email: parsed.data.email,
      p_whatsapp: parsed.data.whatsapp,
      p_business_name: parsed.data.business_name,
      p_address: parsed.data.address,
      p_description: parsed.data.description,
      p_password: password,
    })
    .single<{ status: string; request_id: string | null; otp_code: string | null }>();
  if (error || !data) {
    return { status: "error", message: otpSetupError(error ?? { message: "no row" }, "Signup start"), ...keep };
  }

  if (data.status === "whatsapp_taken" || data.status === "email_taken") {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: TAKEN_ERRORS[data.status] };
  }
  if (data.status === "wait") {
    return { status: "error", message: "We just sent a code. Wait a minute before asking for another.", ...keep };
  }
  if (data.status !== "ok" || !data.request_id || !data.otp_code) {
    return { status: "error", message: "Too many codes were requested for this email. Try again in an hour.", ...keep };
  }

  const sent = await sendVendorOtpEmail(parsed.data.email, data.otp_code, "signup");
  if (!sent.ok) return { status: "error", message: sent.error, ...keep };

  return {
    status: "success",
    step: "code",
    requestId: data.request_id,
    email: parsed.data.email,
    message: codeSentMessage(parsed.data.email, sent.devFallback),
  };
}

/** Enlist, step 2: the emailed code creates the vendor and signs them in. */
export async function verifyVendorSignup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const requestId = parseRequestId(formData);
  const code = parseOtpCode(formData);
  if (!requestId) return { status: "error", message: "This code has expired. Send a new code." };
  if (!code) return { status: "error", fieldErrors: { otp: "Enter the 6-digit code from the email." } };

  const secret = getVendorServerSecret();
  if (!secret) return { status: "error", message: OTP_SETUP_MISSING };

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .rpc("pro_gift_vendor_signup_verify", { p_secret: secret, p_request_id: requestId, p_code: code })
    .single<{ status: string; vendor_code: string | null; session_token: string | null }>();
  if (error || !data) return { status: "error", message: otpSetupError(error ?? { message: "no row" }, "Signup verify") };

  if (data.status === "invalid") {
    return { status: "error", fieldErrors: { otp: "That code isn't right. Check the email and try again." } };
  }
  if (data.status === "whatsapp_taken" || data.status === "email_taken") {
    return {
      status: "error",
      message:
        data.status === "whatsapp_taken"
          ? "This WhatsApp number was just used for another vendor account. Sign in instead."
          : "This email was just used for another vendor account. Go back and use a different one.",
    };
  }
  if (data.status !== "ok" || !data.session_token) {
    return { status: "error", message: "This code has expired or was tried too many times. Send a new code." };
  }

  const token = data.session_token;
  await setVendorCookie(token);

  // The profile exists now; a logo problem shouldn't undo the enlistment.
  let logoNote = "";
  const logoEntry = formData.get("logo");
  if (logoEntry instanceof File && logoEntry.size > 0) {
    const logo = checkImage(logoEntry);
    const saved = logo instanceof File && (await saveLogo(token, logo));
    if (!saved) logoNote = "&logo=failed";
  }

  refreshVendorPages();
  redirect(`${VENDOR_HOME_PATH}?welcome=1${logoNote}`);
}

async function saveLogo(token: string, logo: File): Promise<boolean> {
  const stored = await storeImage(token, logo);
  if ("error" in stored) return false;
  const supabase = createPublicClient();
  const { data: row } = await supabase.rpc("pro_gift_vendor_me", { p_token: token }).maybeSingle<VendorRow>();
  if (!row) return false;
  const { data } = await supabase.rpc(
    "pro_gift_vendor_update_profile",
    profileArgs(token, {
      business_name: row.business_name,
      address: row.address,
      whatsapp: row.whatsapp,
      email: row.email ?? "",
      description: row.description,
      logo_path: stored.path,
    }),
  );
  return data === "ok";
}

export async function signInVendor(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const login = parseVendorLogin(String(formData.get("login") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!login || !password) {
    return { status: "error", message: "Enter your WhatsApp number (e.g. 01712-345678) and password." };
  }

  const { data: token, error } = await createPublicClient().rpc("pro_gift_vendor_login", {
    p_code: login,
    p_password: password,
  });
  // One message for every failure, so the form doesn't reveal which numbers have accounts.
  if (error || typeof token !== "string") {
    if (error) console.error("[vendor] Sign-in failed:", error.message);
    return {
      status: "error",
      message: "WhatsApp number or password is incorrect. After 5 wrong tries, sign-in pauses for 15 minutes.",
    };
  }

  await setVendorCookie(token);
  refreshVendorPages();
  redirect(VENDOR_HOME_PATH);
}

/** Forgot password, step 1: email a code to the address on the account. */
export async function startPasswordReset(prev: OtpStartState, formData: FormData): Promise<OtpStartState> {
  const raw = String(formData.get("login") ?? "").trim();
  const login = raw.includes("@") ? parseEmail(raw) : parseVendorLogin(raw);
  if (!login) {
    return { status: "error", fieldErrors: { login: "Enter your WhatsApp number or the email on your account." } };
  }

  const keep = stayOnCodeStep(prev, formData);
  const secret = getVendorServerSecret();
  if (!secret) {
    console.error("[vendor] VENDOR_SERVER_SECRET is not set; can't reset vendor passwords.");
    return { status: "error", message: OTP_SETUP_MISSING, ...keep };
  }

  const { data, error } = await createPublicClient()
    .rpc("pro_gift_vendor_reset_start", { p_secret: secret, p_login: login })
    .single<{ status: string; request_id: string | null; otp_code: string | null; email: string | null }>();
  if (error || !data) {
    return { status: "error", message: otpSetupError(error ?? { message: "no row" }, "Reset start"), ...keep };
  }
  if (data.status === "wait") {
    return { status: "error", message: "We just sent a code. Wait a minute before asking for another.", ...keep };
  }
  if (data.status === "limit") {
    return { status: "error", message: "Too many codes were requested. Try again in an hour.", ...keep };
  }

  let devFallback = false;
  let requestId: string = randomUUID(); // No account: same screen, but no code will ever match.
  if (data.status === "ok" && data.request_id && data.otp_code && data.email) {
    const sent = await sendVendorOtpEmail(data.email, data.otp_code, "reset");
    if (!sent.ok) return { status: "error", message: sent.error, ...keep };
    devFallback = sent.devFallback;
    requestId = data.request_id;
  }

  return {
    status: "success",
    step: "code",
    requestId,
    message: devFallback
      ? codeSentMessage("", true)
      : "If that account has an email address, we sent a 6-digit code to it. It expires in 10 minutes.",
  };
}

/** Forgot password, step 2: right code → new password, other devices signed out, signed in here. */
export async function completePasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const requestId = parseRequestId(formData);
  const code = parseOtpCode(formData);
  const next = parsePassword(formData, "new_password");
  const fieldErrors: Partial<Record<string, string>> = {};
  if (!code) fieldErrors.otp = "Enter the 6-digit code from the email.";
  if (!next) fieldErrors.new_password = "Use 8–72 characters.";
  else if (formData.get("new_password_confirm") !== next) fieldErrors.new_password_confirm = "Passwords don't match.";
  if (!requestId) return { status: "error", message: "This code has expired. Send a new code." };
  if (Object.keys(fieldErrors).length > 0) return { status: "error", fieldErrors };

  const secret = getVendorServerSecret();
  if (!secret) return { status: "error", message: OTP_SETUP_MISSING };

  const { data, error } = await createPublicClient()
    .rpc("pro_gift_vendor_reset_complete", {
      p_secret: secret,
      p_request_id: requestId,
      p_code: code,
      p_new_password: next,
    })
    .single<{ status: string; session_token: string | null }>();
  if (error || !data) return { status: "error", message: otpSetupError(error ?? { message: "no row" }, "Reset") };

  if (data.status === "invalid") {
    return { status: "error", fieldErrors: { otp: "That code isn't right. Check the email and try again." } };
  }
  if (data.status !== "ok" || !data.session_token) {
    return { status: "error", message: "This code has expired or was tried too many times. Send a new code." };
  }

  await setVendorCookie(data.session_token);
  refreshVendorPages();
  redirect(`${VENDOR_HOME_PATH}?saved=password`);
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

  const { data, error } = await createPublicClient().rpc(
    "pro_gift_vendor_update_profile",
    profileArgs(token, parsed.data),
  );
  if (error) return { status: "error", message: error.message };
  const status = data as ProfileStatus;
  if (status === "signed_out") return SIGNED_OUT;
  if (status === "whatsapp_taken" || status === "email_taken") {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: TAKEN_ERRORS[status] };
  }
  if (status !== "ok") return { status: "error", message: "Your profile couldn't be saved. Please try again." };

  refreshVendorPages();
  redirect(`${VENDOR_HOME_PATH}?saved=profile`);
}

/** Masks an address for display: "rahim@company.com" → "ra•••@company.com". */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}•••@${domain}`;
}

/** Change password, step 1: email a code to the address on the signed-in vendor's account. */
export async function startVendorPasswordChange(prev: OtpStartState, formData: FormData): Promise<OtpStartState> {
  const token = await getVendorToken();
  if (!token) return SIGNED_OUT;

  const keep = stayOnCodeStep(prev, formData);
  const secret = getVendorServerSecret();
  if (!secret) {
    console.error("[vendor] VENDOR_SERVER_SECRET is not set; can't send password-change codes.");
    return { status: "error", message: OTP_SETUP_MISSING, ...keep };
  }

  const { data, error } = await createPublicClient()
    .rpc("pro_gift_vendor_change_password_start", { p_secret: secret, p_token: token })
    .single<{ status: string; request_id: string | null; otp_code: string | null; email: string | null }>();
  if (error || !data) {
    return { status: "error", message: otpSetupError(error ?? { message: "no row" }, "Password change start"), ...keep };
  }

  if (data.status === "signed_out") return SIGNED_OUT;
  if (data.status === "no_email") {
    return {
      status: "error",
      message: "Add an email address to your business profile above and save it first. We send the code there.",
    };
  }
  if (data.status === "wait") {
    return { status: "error", message: "We just sent a code. Wait a minute before asking for another.", ...keep };
  }
  if (data.status !== "ok" || !data.request_id || !data.otp_code || !data.email) {
    return { status: "error", message: "Too many codes were requested. Try again in an hour.", ...keep };
  }

  const sent = await sendVendorOtpEmail(data.email, data.otp_code, "password_change");
  if (!sent.ok) return { status: "error", message: sent.error, ...keep };

  const masked = maskEmail(data.email);
  return {
    status: "success",
    step: "code",
    requestId: data.request_id,
    email: masked,
    message: codeSentMessage(masked, sent.devFallback),
  };
}

/** Change password, step 2: right code → new password; other devices are signed out, this one stays in. */
export async function completeVendorPasswordChange(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = await getVendorToken();
  if (!token) return SIGNED_OUT;

  const requestId = parseRequestId(formData);
  const code = parseOtpCode(formData);
  const next = parsePassword(formData, "new_password");
  const fieldErrors: Partial<Record<string, string>> = {};
  if (!code) fieldErrors.otp = "Enter the 6-digit code from the email.";
  if (!next) fieldErrors.new_password = "Use 8–72 characters.";
  else if (formData.get("new_password_confirm") !== next) fieldErrors.new_password_confirm = "Passwords don't match.";
  if (!requestId) return { status: "error", message: "This code has expired. Send a new code." };
  if (Object.keys(fieldErrors).length > 0) return { status: "error", fieldErrors };

  const secret = getVendorServerSecret();
  if (!secret) return { status: "error", message: OTP_SETUP_MISSING };

  const { data, error } = await createPublicClient().rpc("pro_gift_vendor_change_password_complete", {
    p_secret: secret,
    p_token: token,
    p_request_id: requestId,
    p_code: code,
    p_new_password: next,
  });
  if (error) return { status: "error", message: otpSetupError(error, "Password change") };

  if (data === "signed_out") return SIGNED_OUT;
  if (data === "invalid") {
    return { status: "error", fieldErrors: { otp: "That code isn't right. Check the email and try again." } };
  }
  if (data !== "ok") {
    return { status: "error", message: "This code has expired or was tried too many times. Send a new code." };
  }
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
