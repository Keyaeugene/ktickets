import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { 
    remotePatterns: [ 
      { hostname: "next-moose-65.convex.cloud", protocol: "https" },
    ],
  },
};

export default nextConfig;
