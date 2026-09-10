// Cross-app link configuration, ported from the Vite site's config/links.ts.
// The marketing site links out to the webapp for all product features.

export const WEBAPP_URL =
  process.env.NEXT_PUBLIC_WEBAPP_URL ?? "https://app.getartcraft.com/";

// Large media (feature footage, hero video) is served from the currently
// deployed site rather than duplicated into this app's public/ directory.
// Point this at "" once the assets migrate here.
export const MEDIA_BASE =
  process.env.NEXT_PUBLIC_MEDIA_BASE ?? "https://getartcraft.com";

export function webappUrl(path: string): string {
  return `${WEBAPP_URL}${path.replace(/^\//, "")}`;
}

export function mediaUrl(path: string): string {
  return `${MEDIA_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

// Showcase clips live on the FakeYou CDN, which serves no
// Access-Control-Allow-Origin header. The hero wall draws them as WebGL
// video textures, which require CORS-clean sources, so they go through the
// same-origin /cdn-media rewrite (see next.config.ts).
export function cdnMediaUrl(path: string): string {
  return `/cdn-media${path.startsWith("/") ? path : `/${path}`}`;
}

export const SOCIAL_LINKS = {
  DISCORD: "https://discord.gg/artcraft",
  YOUTUBE: "https://www.youtube.com/@OfficialArtCraftStudios",
  TIKTOK: "https://www.tiktok.com/@artcraft.studios",
  GITHUB: "https://github.com/storytold/artcraft",
  INSTAGRAM: "https://www.instagram.com/get_artcraft",
  LINKEDIN: "https://www.linkedin.com/company/artcraft-ai",
  REDDIT: "https://www.reddit.com/r/ArtCraftAI/",
} as const;

export const SUPPORT_EMAIL = "hello@storyteller.ai";
