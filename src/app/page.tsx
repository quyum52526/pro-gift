import { getProducts } from "@/data/products";
import { ProductCard } from "@/components/product/product-card";

// Placeholder catalogue page so product detail pages are reachable.
export default async function Home() {
  const products = await getProducts();

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 md:px-8">
      <p className="text-sm font-medium text-gold-deep">Pro Gift</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink md:text-4xl">
        Premium corporate gifts
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Branded with your logo, delivered across Bangladesh. Request a quote on WhatsApp.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </main>
  );
}
