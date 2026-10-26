import "server-only";

import { redirect } from "next/navigation";

import { createSessionClient } from "@/lib/supabase/server";

export const ADMIN_LOGIN_PATH = "/admin/login";

export interface AdminSession {
  supabase: Awaited<ReturnType<typeof createSessionClient>>;
  email: string;
}

/**
 * Returns the admin session or null. `getUser()` re-validates the token with
 * Supabase Auth; `pro_gift_is_admin()` checks the email allow-list in Postgres.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: isAdmin, error } = await supabase.rpc("pro_gift_is_admin");
  if (error || isAdmin !== true) return null;

  return { supabase, email: user.email };
}

/** For pages: redirects to the login screen when the visitor isn't an admin. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect(ADMIN_LOGIN_PATH);
  return session;
}
