// Master switch for the website→webapp split. Flip to `false` to bring all
// app routes (login/signup/create/library/welcome/onboarding/checkout/…) back
// onto the marketing site instead of redirecting to app.getartcraft.com.
//
// When `true` (current default):
//   - app.tsx mounts WebappRedirect for the legacy paths
//   - navbar shows a single "Launch App" button (no Login/Sign up)
//   - landing3 / media-page Recreate / download-modal links point at the webapp
//
// When `false`:
//   - The original local pages (login/signup/create-image/etc.) are served
//   - Navbar shows Login + Sign up buttons targeting the local routes
//   - landing3 / media / download-modal use local routes
export const USE_WEBAPP_FOR_APP_FEATURES = true;

// In dev, point at the artcraft-webapp Vite server (port 4201) so cross-app
// links work end-to-end without deploying. Production hits app.getartcraft.com.
export const WEBAPP_URL = import.meta.env.DEV
  ? "http://localhost:4201/"
  : "https://app.getartcraft.com/";

// Resolves an in-app path. When the webapp split is enabled, returns a fully
// qualified webapp URL so an `<a href>` navigates cross-origin. When disabled,
// returns the path unchanged so it can be used with React Router `<Link to>`.
// Path may include leading slash; route params (`:id`) are substituted from
// the optional `params` map.
export function appLink(
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
  // Drop any unfilled params.
  resolved = resolved.replace(/\/?:\w+/g, "");
  if (!USE_WEBAPP_FOR_APP_FEATURES) {
    return resolved.startsWith("/") ? resolved : `/${resolved}`;
  }
  return `${WEBAPP_URL}${resolved.replace(/^\//, "")}`;
}

// Always-cross-origin webapp URL (used for the Launch App button regardless of
// the flag, since "Launch App" is only rendered when the flag is on).
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
