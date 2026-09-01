import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Same-origin proxy for large media served from the live site. The hero
  // rail draws these as WebGL video textures, which need CORS-clean
  // sources — getartcraft.com serves its videos without
  // Access-Control-Allow-Origin, so we route them through our own origin.
  async rewrites() {
    return [
      {
        source: "/ext-media/:path*",
        destination: "https://getartcraft.com/:path*",
      },
    ];
  },
};

export default nextConfig;
