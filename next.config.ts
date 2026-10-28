import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Top-level since Next 16; required by the "use cache" catalogue reads.
  cacheComponents: true,
  experimental: {
    // Still under `experimental` in Next 16. One image per upload action: 4 MB file + multipart overhead.
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    // Supabase Storage public buckets (product images uploaded from /admin).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nxqmgcekrtgzgykwftty.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
