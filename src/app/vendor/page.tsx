import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Lock, PackageOpen, Pencil, Plus, TriangleAlert, UserRound } from "lucide-react";

import { VendorAuthForms } from "@/components/vendor/vendor-auth-forms";
import { DeleteProductButton } from "@/components/vendor/delete-product-button";
import { VendorProductCard, VendorProductGrid } from "@/components/vendor/vendor-product-card";
import { VendorProfileHeader } from "@/components/vendor/vendor-profile-header";
import { Button } from "@/components/ui/button";
import { listOwnProducts } from "@/lib/vendor/queries";
import { getVendorSession, type VendorSession } from "@/lib/vendor/session";

export const metadata: Metadata = { title: "Vendor portal" };

export default function VendorHomePage({ searchParams }: PageProps<"/vendor">) {
  return (
    <Suspense fallback={<PortalSkeleton />}>
      <VendorHome searchParams={searchParams} />
    </Suspense>
  );
}

async function VendorHome({ searchParams }: Pick<PageProps<"/vendor">, "searchParams">) {
  const [session, params] = await Promise.all([getVendorSession(), searchParams]);
  if (!session) return <SignedOut initialTab={params.tab === "enlist" ? "enlist" : "signin"} />;

  return (
    <Dashboard
      session={session}
      welcome={typeof params.welcome === "string"}
      logoFailed={params.logo === "failed"}
      saved={typeof params.saved === "string" ? params.saved : null}
    />
  );
}

function SignedOut({ initialTab }: { initialTab: "signin" | "enlist" }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,32rem)] lg:items-start">
      <div className="lg:pt-6">
        <p className="text-xs font-semibold tracking-[0.08em] text-teal uppercase">For suppliers & makers</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Become a Pro Gift vendor</h1>
        <p className="mt-3 max-w-prose text-muted-foreground">
          List what you make or supply, with your price ranges. When a corporate client asks Pro Gift for something
          you carry, our team finds it here and messages you on WhatsApp for a price.
        </p>
        <ul className="mt-6 flex flex-col gap-3 text-sm text-ink">
          <li className="flex gap-2">
            <UserRound className="h-5 w-5 shrink-0 text-gold-deep" aria-hidden />
            Enlist once and get your own Vendor ID to sign in with.
          </li>
          <li className="flex gap-2">
            <PackageOpen className="h-5 w-5 shrink-0 text-gold-deep" aria-hidden />
            Add as many products as you like, with photos, specs and price ranges.
          </li>
          <li className="flex gap-2">
            <Lock className="h-5 w-5 shrink-0 text-gold-deep" aria-hidden />
            Private: your page is visible only to you and the Pro Gift team, never in the public shop.
          </li>
        </ul>
      </div>
      <VendorAuthForms initialTab={initialTab} />
    </div>
  );
}

const SAVED_MESSAGES: Record<string, string> = {
  profile: "Profile saved.",
  product: "Product saved.",
  deleted: "Product deleted.",
};

async function Dashboard({
  session,
  welcome,
  logoFailed,
  saved,
}: {
  session: VendorSession;
  welcome: boolean;
  logoFailed: boolean;
  saved: string | null;
}) {
  const { vendor, token } = session;
  const products = await listOwnProducts(token);
  const savedMessage = saved ? SAVED_MESSAGES[saved] : undefined;

  return (
    <div className="flex flex-col gap-6">
      {welcome && (
        <div role="status" className="rounded-2xl border border-gold/50 bg-gold/10 px-5 py-4 text-ink">
          <p className="font-semibold">Welcome to Pro Gift! Your vendor profile is ready.</p>
          <p className="mt-1 text-sm">
            Your Vendor ID is <span className="font-mono text-base font-bold">{vendor.code}</span>. Write it down: you
            need it with your password to sign in.
          </p>
        </div>
      )}
      {logoFailed && (
        <p
          role="alert"
          className="flex flex-wrap items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <TriangleAlert className="h-4 w-4" aria-hidden />
          Your logo couldn&apos;t be uploaded.
          <Link href="/vendor/profile" className="font-medium underline">
            Try again from your profile.
          </Link>
        </p>
      )}
      {savedMessage && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border border-teal/30 bg-surface px-4 py-3 text-sm text-ink"
        >
          <CheckCircle2 className="h-4 w-4 text-teal" aria-hidden />
          {savedMessage}
        </p>
      )}

      <VendorProfileHeader
        vendor={vendor}
        productCount={products.length}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/vendor/profile">
              <Pencil className="h-3.5 w-3.5" /> Edit profile
            </Link>
          </Button>
        }
      />

      <section aria-labelledby="products-heading" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="products-heading" className="text-xl font-bold tracking-tight text-ink">
              Your products
            </h2>
            <p className="text-sm text-muted-foreground">
              This is how Pro Gift sees them. The WhatsApp button opens a chat with your own number.
            </p>
          </div>
          <Button asChild>
            <Link href="/vendor/products/new">
              <Plus className="h-4 w-4" /> Add product
            </Link>
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-surface px-6 py-12 text-center">
            <PackageOpen className="h-8 w-8 text-gold-deep" aria-hidden />
            <p className="font-medium text-ink">No products yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add your first product with a photo and price range so Pro Gift can source it for clients.
            </p>
            <Button asChild className="mt-1">
              <Link href="/vendor/products/new">
                <Plus className="h-4 w-4" /> Add product
              </Link>
            </Button>
          </div>
        ) : (
          <VendorProductGrid>
            {products.map((product) => (
              <VendorProductCard
                key={product.id}
                product={product}
                vendor={vendor}
                footer={
                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/vendor/products/${product.id}/edit`}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                    </Button>
                    <DeleteProductButton productId={product.id} productName={product.name} />
                  </div>
                }
              />
            ))}
          </VendorProductGrid>
        )}
      </section>
    </div>
  );
}

function PortalSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
      <div className="h-40 animate-pulse rounded-2xl border bg-surface" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl border bg-surface" />
        ))}
      </div>
    </div>
  );
}
