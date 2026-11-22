import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createPublicClient } from "@/lib/supabase/server";
import { rowToVendor, type VendorProfile, type VendorRow } from "./types";

/** httpOnly cookie holding the raw session token. Postgres only stores its hash. */
export const VENDOR_COOKIE = "pg_vendor_session";
export const VENDOR_HOME_PATH = "/vendor";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // matches the 30-day expiry in Postgres

export interface VendorSession {
  token: string;
  vendor: VendorProfile;
}

export async function setVendorCookie(token: string) {
  (await cookies()).set(VENDOR_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearVendorCookie() {
  (await cookies()).delete(VENDOR_COOKIE);
}

export async function getVendorToken(): Promise<string | null> {
  const token = (await cookies()).get(VENDOR_COOKIE)?.value;
  return token && /^[0-9a-f]{64}$/.test(token) ? token : null;
}

/**
 * The signed-in vendor, or null. Every vendor read and write goes through a
 * security definer function that resolves the token again, so this is only
 * used to decide what to render. Deduplicated per request.
 */
export const getVendorSession = cache(async (): Promise<VendorSession | null> => {
  const token = await getVendorToken();
  if (!token) return null;

  const { data, error } = await createPublicClient()
    .rpc("pro_gift_vendor_me", { p_token: token })
    .maybeSingle<VendorRow>();
  if (error) {
    console.error("[vendor] Session lookup failed:", error.message);
    return null;
  }
  return data ? { token, vendor: rowToVendor(data) } : null;
});

/** For vendor pages: back to the sign-in screen when signed out. */
export async function requireVendor(): Promise<VendorSession> {
  const session = await getVendorSession();
  if (!session) redirect(VENDOR_HOME_PATH);
  return session;
}
