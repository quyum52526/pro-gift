import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus, Store, Users } from "lucide-react";

import { VendorSearchForm } from "@/components/admin/vendor-search-form";
import { WhatsAppIcon } from "@/components/product/whatsapp-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/auth";
import { listVendors } from "@/lib/vendor/queries";
import { buildVendorContactUrl, formatWhatsAppNumber } from "@/lib/vendor/whatsapp";

export const metadata: Metadata = { title: "Vendors" };

export default function AdminVendorsPage() {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Vendors</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every enlisted vendor. Open one to see their profile and products; no vendor password needed.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/vendors/new">
            <Plus className="h-4 w-4" aria-hidden /> Create vendor
          </Link>
        </Button>
      </div>
      <div className="mt-5">
        <VendorSearchForm />
      </div>
      <Suspense fallback={<ListSkeleton />}>
        <VendorList />
      </Suspense>
    </>
  );
}

async function VendorList() {
  const admin = await requireAdmin();
  const vendors = await listVendors(admin);

  if (vendors.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-dashed bg-surface px-6 py-12 text-center">
        <Users className="h-8 w-8 text-gold-deep" aria-hidden />
        <p className="font-medium text-ink">No vendors yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Vendors enlist from the &quot;Vendor&quot; link in the site header (/vendor), or use &quot;Create vendor&quot;.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Vendor directory" className="mt-6 overflow-hidden rounded-xl border bg-surface">
      <header className="flex items-center justify-between gap-3 border-b bg-surface-tint/60 px-4 py-3">
        <h2 className="font-semibold text-ink">Directory</h2>
        <Badge variant="secondary">
          {vendors.length} {vendors.length === 1 ? "vendor" : "vendors"}
        </Badge>
      </header>
      <ul className="divide-y">
        {vendors.map((vendor) => (
          <li key={vendor.id} className="flex items-center gap-3 px-4 py-3">
            <Link
              href={`/admin/vendors/${vendor.id}`}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-surface-tint">
                {vendor.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={vendor.logoUrl} alt="" className="h-full w-full object-contain p-0.5" />
                ) : (
                  <Store className="h-5 w-5 text-teal" aria-hidden />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium text-ink">{vendor.businessName}</span>
                  {!vendor.isActive && <Badge variant="outline">Disabled</Badge>}
                </span>
                <span className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  <span>{formatWhatsAppNumber(vendor.whatsapp)}</span>
                  {vendor.email && <span className="truncate">{vendor.email}</span>}
                  <span className="font-mono">{vendor.code}</span>
                  <span>
                    {vendor.productCount} {vendor.productCount === 1 ? "product" : "products"}
                  </span>
                  <span className="truncate">{vendor.address}</span>
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
            <a
              href={buildVendorContactUrl(vendor)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${vendor.businessName} at ${formatWhatsAppNumber(vendor.whatsapp)}`}
              title={formatWhatsAppNumber(vendor.whatsapp)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-whatsapp text-surface transition hover:bg-whatsapp-dark"
            >
              <WhatsAppIcon className="h-4 w-4" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ListSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-2" aria-busy="true" aria-label="Loading vendors">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl border bg-surface" />
      ))}
    </div>
  );
}
