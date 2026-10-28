import type { NextConfig } from "next";

type RemotePattern = Exclude<NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number], URL>;

// Uploaded product images are served from Supabase Storage public buckets.
// The host comes from the env so it always matches the project the app talks to.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

function supabaseImagePatterns(): RemotePattern[] {
  if (!supabaseUrl) {
    console.warn("[next.config] NEXT_PUBLIC_SUPABASE_URL is not set: Supabase images will be blocked by next/image.");
    return [];
  }
  const { protocol, hostname } = new URL(supabaseUrl);
  return [
    {
      protocol: protocol.replace(":", "") as "https" | "http",
      hostname,
      pathname: "/storage/v1/object/public/**",
    },
  ];
}

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  images: {
    remotePatterns: [
      // Requested entry, kept as given. Note: this host does not resolve; the live
      // project is the NEXT_PUBLIC_SUPABASE_URL host ("...gykwftty"), allowed below.
      {
        protocol: "https",
        hostname: "nxqmgcekrtgzgykwffty.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      ...supabaseImagePatterns(),
    ],
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
