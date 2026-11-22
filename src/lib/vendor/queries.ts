import "server-only";

import type { AdminSession } from "@/lib/admin/auth";
import { createPublicClient } from "@/lib/supabase/server";
import {
  VENDOR_COLUMNS,
  rowToVendor,
  rowToVendorProduct,
  searchRowToHit,
  type VendorProduct,
  type VendorProductRow,
  type VendorProfile,
  type VendorRow,
  type VendorSearchRow,
} from "./types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------- vendor portal

/** The signed-in vendor's own products, newest first. */
export async function listOwnProducts(token: string): Promise<VendorProduct[]> {
  const { data, error } = await createPublicClient().rpc("pro_gift_vendor_products", { p_token: token });
  if (error) throw new Error(`Failed to load your products: ${error.message}`);
  // Untyped client: rpc() results are `any`. The function returns setof vendor_products.
  return ((data ?? []) as VendorProductRow[]).map(rowToVendorProduct);
}

export async function getOwnProduct(token: string, id: string): Promise<VendorProduct | null> {
  if (!UUID.test(id)) return null;
  const products = await listOwnProducts(token);
  return products.find((product) => product.id === id) ?? null;
}

// ---------------------------------------------------------------- admin
// Uncached and run as the admin: RLS lets only allow-listed admins read vendors.

export interface VendorListItem extends VendorProfile {
  productCount: number;
}

export async function listVendors({ supabase }: AdminSession): Promise<VendorListItem[]> {
  const { data, error } = await supabase
    .from("vendors")
    .select(`${VENDOR_COLUMNS}, vendor_products(count)`)
    .order("business_name")
    .overrideTypes<(VendorRow & { vendor_products: { count: number }[] })[], { merge: false }>();
  if (error) throw new Error(`Failed to load vendors: ${error.message}`);
  return data.map((row) => ({ ...rowToVendor(row), productCount: row.vendor_products[0]?.count ?? 0 }));
}

export async function getVendorWithProducts(
  { supabase }: AdminSession,
  id: string,
): Promise<{ vendor: VendorProfile; products: VendorProduct[] } | null> {
  if (!UUID.test(id)) return null;
  const [vendorResult, productsResult] = await Promise.all([
    supabase.from("vendors").select(VENDOR_COLUMNS).eq("id", id).maybeSingle<VendorRow>(),
    supabase
      .from("vendor_products")
      .select("*")
      .eq("vendor_id", id)
      .order("created_at", { ascending: false })
      .overrideTypes<VendorProductRow[], { merge: false }>(),
  ]);
  if (vendorResult.error) throw new Error(`Failed to load vendor: ${vendorResult.error.message}`);
  if (productsResult.error) throw new Error(`Failed to load vendor products: ${productsResult.error.message}`);
  if (!vendorResult.data) return null;
  return { vendor: rowToVendor(vendorResult.data), products: productsResult.data.map(rowToVendorProduct) };
}

export async function searchVendorProducts({ supabase }: AdminSession, query: string) {
  const { data, error } = await supabase.rpc("pro_gift_admin_search_vendor_products", {
    p_query: query.slice(0, 120),
  });
  if (error) throw new Error(`Search failed: ${error.message}`);
  return ((data ?? []) as VendorSearchRow[]).map(searchRowToHit);
}
