import type { Product } from "@/types/product";

/*
 * Static catalogue for now. Swap these functions for a CMS or database query
 * later; pages only depend on getProducts / getProductBySlug.
 */
const products: Product[] = [
  {
    slug: "executive-ceramic-mug",
    code: "PG-MUG-101",
    name: "Executive Ceramic Mug",
    category: { name: "Drinkware", slug: "drinkware" },
    shortDescription: "350 ml premium ceramic mug with a glossy finish, made for logo branding.",
    description:
      "A heavyweight 350 ml ceramic mug with a smooth glossy glaze and comfortable C-handle. It takes full-colour sublimation and screen printing well, so your logo stays sharp through daily office use and dishwashing. A good fit for onboarding kits, client gifts and events.",
    priceRange: { min: 350, max: 650 },
    moq: 50,
    images: [
      {
        src: "/products/mug-front.svg",
        alt: "White executive ceramic mug, front view",
        printArea: { x: 31, y: 42, width: 30, height: 24 },
      },
      {
        src: "/products/mug-teal.svg",
        alt: "Teal executive ceramic mug",
        printArea: { x: 31, y: 42, width: 30, height: 24 },
      },
      {
        src: "/products/mug-ink.svg",
        alt: "Matte black executive ceramic mug",
        printArea: { x: 31, y: 42, width: 30, height: 24 },
      },
    ],
    tags: [
      { label: "350 ml", icon: "ruler" },
      { label: "3 colours", icon: "palette" },
      { label: "Gift box available", icon: "package" },
      { label: "Bestseller", icon: "sparkles" },
    ],
    specs: [
      { label: "Material", value: "Grade-A ceramic" },
      { label: "Capacity", value: "350 ml" },
      { label: "Print area", value: "8 × 6 cm" },
      { label: "Lead time", value: "5–7 working days" },
    ],
    brandingMethods: ["Sublimation", "Screen print", "Laser engraving"],
  },
  {
    slug: "executive-leather-diary",
    code: "PG-DRY-204",
    name: "Executive Leather Diary",
    category: { name: "Stationery", slug: "stationery" },
    shortDescription: "A5 PU-leather diary with ribbon marker and elastic band.",
    description:
      "An A5 hardcover diary wrapped in soft-touch PU leather, with 192 pages of 80 gsm cream paper, a ribbon marker and an elastic closure. Debossed or foil-stamped logos look refined on the cover, making it a staple for year-end and annual meeting gifts.",
    priceRange: { min: 450, max: 1200 },
    moq: 30,
    images: [
      {
        src: "/products/diary-front.svg",
        alt: "Black executive leather diary, front cover",
        printArea: { x: 31, y: 36, width: 32, height: 22 },
      },
      {
        src: "/products/diary-teal.svg",
        alt: "Teal executive leather diary",
        printArea: { x: 31, y: 36, width: 32, height: 22 },
      },
      {
        src: "/products/diary-tan.svg",
        alt: "Tan executive leather diary",
        printArea: { x: 31, y: 36, width: 32, height: 22 },
      },
    ],
    tags: [
      { label: "A5 size", icon: "ruler" },
      { label: "3 cover colours", icon: "palette" },
      { label: "Gold foil option", icon: "sparkles" },
    ],
    specs: [
      { label: "Cover", value: "Soft-touch PU leather" },
      { label: "Pages", value: "192 · 80 gsm cream" },
      { label: "Size", value: "A5 (14.8 × 21 cm)" },
      { label: "Lead time", value: "7–10 working days" },
    ],
    brandingMethods: ["Deboss", "Gold / silver foil", "UV print"],
  },
  {
    slug: "steel-vacuum-tumbler",
    code: "PG-TMB-310",
    name: "Steel Vacuum Tumbler",
    category: { name: "Drinkware", slug: "drinkware" },
    shortDescription: "500 ml double-wall stainless steel tumbler, keeps drinks hot for 12 hours.",
    description:
      "A 500 ml double-wall vacuum tumbler in 304 stainless steel with a leak-proof lid. It keeps drinks hot for 12 hours and cold for 24. Laser engraving reveals bright steel under the powder coat for a clean, permanent logo.",
    priceRange: { min: 950, max: 2500 },
    moq: 25,
    images: [
      {
        src: "/products/tumbler-front.svg",
        alt: "Stainless steel vacuum tumbler, front view",
        printArea: { x: 40, y: 44, width: 20, height: 18 },
      },
      {
        src: "/products/tumbler-teal.svg",
        alt: "Teal powder-coated vacuum tumbler",
        printArea: { x: 40, y: 44, width: 20, height: 18 },
      },
      {
        src: "/products/tumbler-gold.svg",
        alt: "Gold powder-coated vacuum tumbler",
        printArea: { x: 40, y: 44, width: 20, height: 18 },
      },
    ],
    tags: [
      { label: "500 ml", icon: "ruler" },
      { label: "BPA-free", icon: "leaf" },
      { label: "Premium", icon: "sparkles" },
    ],
    specs: [
      { label: "Material", value: "304 stainless steel" },
      { label: "Capacity", value: "500 ml" },
      { label: "Insulation", value: "12 h hot · 24 h cold" },
      { label: "Lead time", value: "7–12 working days" },
    ],
    brandingMethods: ["Laser engraving", "UV print", "Screen print"],
  },
];

export async function getProducts(): Promise<Product[]> {
  return products;
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return products.find((product) => product.slug === slug);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  return products.filter((p) => p.slug !== product.slug).slice(0, limit);
}
