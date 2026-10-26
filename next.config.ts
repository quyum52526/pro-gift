import type { NextConfig } from "next";

// Uploaded product images are served from the Supabase Storage public bucket.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  images: {
    remotePatterns: supabaseUrl
      ? [new URL(`${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/product-images/**`)]
      : [],
  },
  experimental: {
    serverActions: {
      // One image per upload action: 4 MB file + multipart overhead.
      bodySizeLimit: "5mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
