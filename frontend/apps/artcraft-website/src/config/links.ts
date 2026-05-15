// In dev, point at the artcraft-webapp Vite server (port 4201) so cross-app
// links work end-to-end without deploying. Production hits app.getartcraft.com.
export const WEBAPP_URL = import.meta.env.DEV
  ? "http://localhost:4201/"
  : "https://app.getartcraft.com/";

// Build a fully-qualified webapp URL for a given path. The path may include
// leading slash, query string, or hash; route params (`:id`) are substituted
// from the optional `params` map.
export function webappUrl(
  path: string,
  params?: Record<string, string | undefined>,
): string {
  let resolved = path;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        resolved = resolved.replace(`:${key}`, encodeURIComponent(value));
      }
    }
  }
  // Drop any unfilled params and the leading slash so it concatenates cleanly.
  resolved = resolved.replace(/\/?:\w+/g, "").replace(/^\//, "");
  return `${WEBAPP_URL}${resolved}`;
}

export const SOCIAL_LINKS = {
  DISCORD: "https://discord.gg/artcraft", // Previously: "https://discord.gg/75svZP2Vje"
  YOUTUBE: "https://www.youtube.com/@OfficialArtCraftStudios",
  TIKTOK: "https://www.tiktok.com/@artcraft.studios",
  GITHUB: "https://github.com/storytold/artcraft",
  INSTAGRAM: "https://www.instagram.com/get_artcraft",
  LINKEDIN: "https://www.linkedin.com/company/artcraft-ai",
  REDDIT: "https://www.reddit.com/r/ArtCraftAI/",
} as const;

export const SUPPORT_EMAIL = "hello@storyteller.ai";
