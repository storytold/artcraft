import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Same-origin proxies for large media served from other origins. The hero
  // wall draws its clips as WebGL video textures, which need CORS-clean
  // sources, and neither CDN sends Access-Control-Allow-Origin, so those
  // requests route through our own origin.
  async rewrites() {
    return [
      // Showcase clips for the hero wall (see cdnMediaUrl in lib/links.ts).
      {
        source: "/cdn-media/:path*",
        destination: "https://frontend-cdn.fakeyou.com/:path*",
      },
      // Feature footage and other assets still hosted on the live site.
      {
        source: "/ext-media/:path*",
        destination: "https://getartcraft.com/:path*",
      },
    ];
  },
};

export default nextConfig;
