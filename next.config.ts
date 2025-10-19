import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: { 
    remotePatterns: [ 
      { hostname: "next-moose-65.convex.cloud", protocol: "https"},
      { hostname: "next-moose-65.convex.cloud", protocol: "https"},
    ],
  },
};

export default nextConfig;
