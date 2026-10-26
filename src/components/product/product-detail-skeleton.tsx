/** Loading shell for the product page, mirroring the gallery + details layout. */
export function ProductDetailSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-7xl animate-pulse px-4 pt-6 md:px-8 md:pt-8"
      aria-busy="true"
      aria-label="Loading product"
    >
      <div className="mb-6 h-5 w-64 rounded bg-surface-tint" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-4">
          <div className="aspect-[4/5] w-full rounded-2xl bg-surface-tint" />
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-surface-tint" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-6 w-40 rounded-full bg-surface-tint" />
          <div className="h-10 w-3/4 rounded bg-surface-tint" />
          <div className="h-5 w-full rounded bg-surface-tint" />
          <div className="mt-2 h-48 w-full rounded-2xl bg-surface-tint" />
          <div className="h-32 w-full rounded-2xl bg-surface-tint" />
        </div>
      </div>
    </div>
  );
}
