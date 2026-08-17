import type { MetadataRoute } from "next";

const SITE_URL = "https://getartcraft.com";

// Only routes this app actually serves. Grows as marketing pages migrate
// over from the Vite site.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
