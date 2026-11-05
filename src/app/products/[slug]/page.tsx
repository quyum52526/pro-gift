import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getProductBySlug, getProducts, getRelatedProducts } from "@/data/products";
import { categoryHref, primaryCategory } from "@/lib/catalog/category-filter";
import { DEFAULT_OG_IMAGE, OPEN_GRAPH_DEFAULTS, SITE_URL, absoluteUrl } from "@/lib/site";
import { formatPriceRange } from "@/lib/utils";
import { ProductDetailPage } from "@/components/product/product-detail-page";
import { ProductCard } from "@/components/product/product-card";
import { ProductDetailSkeleton } from "@/components/product/product-detail-skeleton";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const price = formatPriceRange(product.priceRange.min, product.priceRange.max);
  const image = product.images.at(0);
  return {
    title: `${product.name} (${product.code})`,
    description: `${product.shortDescription} Price range ${price}. Custom logo branding available.`,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      ...OPEN_GRAPH_DEFAULTS,
      title: product.name,
      description: product.shortDescription,
      url: `/products/${product.slug}`,
      images: [image ? { url: image.src, alt: image.alt } : DEFAULT_OG_IMAGE],
    },
  };
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  // Slug-dependent work suspends inside the boundary so client navigations stay instant.
  return (
    <main className="flex-1">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductContent params={params} />
      </Suspense>
    </main>
  );
}

async function ProductContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const productUrl = `${SITE_URL}/products/${product.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.code,
    description: product.description,
    image: product.images.map((img) => absoluteUrl(img.src)),
    brand: { "@type": "Brand", name: "Pro Gift" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BDT",
      lowPrice: product.priceRange.min,
      highPrice: product.priceRange.max,
      url: productUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <ProductDetailPage
        product={product}
        productUrl={productUrl}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: primaryCategory(product).name, href: categoryHref(primaryCategory(product).slug) },
          { label: product.name },
        ]}
      />

      {related.length > 0 && (
        <section
          aria-labelledby="related-heading"
          className="mx-auto w-full max-w-7xl px-4 pb-28 md:px-8 md:pb-16"
        >
          <h2 id="related-heading" className="text-2xl font-bold tracking-tight text-ink">
            You might also like
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
