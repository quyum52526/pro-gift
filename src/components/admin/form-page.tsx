import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function FormPageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-teal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> All products
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-0.5 font-mono text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading form">
      {[180, 120, 160, 220].map((height) => (
        <div key={height} className="animate-pulse rounded-xl border bg-surface" style={{ height }} />
      ))}
    </div>
  );
}
