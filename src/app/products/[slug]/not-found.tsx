import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-mono text-sm text-gold-deep">404</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">Product not found</h1>
      <p className="mt-2 text-muted-foreground">
        This item may have been renamed or removed from the catalogue.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Browse all gifts</Link>
      </Button>
    </main>
  );
}
