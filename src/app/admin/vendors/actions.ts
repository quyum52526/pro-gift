"use server";

import { revalidatePath } from "next/cache";

import { getAdminSession } from "@/lib/admin/auth";

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
