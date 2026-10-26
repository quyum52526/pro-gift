"use server";

import { redirect } from "next/navigation";

import { ADMIN_LOGIN_PATH } from "@/lib/admin/auth";
import type { ActionState } from "@/lib/admin/form-state";
import { createSessionClient } from "@/lib/supabase/server";

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { status: "error", message: "Enter your email and password." };

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  // Same message for every failure, so the form doesn't reveal which emails exist.
  if (error) return { status: "error", message: "Email or password is incorrect." };

  const { data: isAdmin } = await supabase.rpc("pro_gift_is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    return { status: "error", message: "This account doesn't have admin access." };
  }

  redirect("/admin/products");
}

export async function signOut(): Promise<void> {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect(ADMIN_LOGIN_PATH);
}
