import { StorytellerApiHostStore } from "./config/StorytellerApiHostStore.js";

// TODO(bt,2025-05-15): Remove this code
const PRODUCTION_CDN_ORIGIN = "https://cdn-2.fakeyou.com";

/**
 * Origin that media bucket paths are resolved against.
 *
 * When the API host is a local one, media is served by that same process
 * (fake-storyteller-web, or a local backend writing to a filesystem bucket)
 * rather than by the CDN, so the API host is the correct origin. Any other
 * host — including every production and staging build — keeps the CDN.
 */
export function GetCdnOrigin(): string {
  const apiSchemeAndHost = StorytellerApiHostStore.getInstance().getApiSchemeAndHost();
  return isLocalHost(apiSchemeAndHost) ? apiSchemeAndHost : PRODUCTION_CDN_ORIGIN;
}

function isLocalHost(url: string): boolean {
  return url.includes("//localhost") || url.includes("//127.0.0.1");
}
