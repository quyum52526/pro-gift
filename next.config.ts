import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    // any experimental features if needed
  },
  serverActions: {
    bodySizeLimit: '5mb',
  },
  images: {
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