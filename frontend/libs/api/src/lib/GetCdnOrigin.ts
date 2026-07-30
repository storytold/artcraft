import { StorytellerApiHostStore } from "./config/StorytellerApiHostStore";

// TODO(bt,2025-05-15): Remove this code
//
// Legacy CDN origin for callers that rebuild media URLs from raw bucket
// paths instead of using the `media_links` the API returns (pagescene's
// asset thumbnails are the last live consumer). When the API host is a
// local dev backend, that backend serves media itself (CDN_BASE_URL +
// /media mount), so the CDN origin IS the API origin.
export function GetCdnOrigin(): string {
  const apiHost = StorytellerApiHostStore.getInstance().getApiSchemeAndHost();
  if (apiHost.includes("localhost") || apiHost.includes("127.0.0.1")) {
    return apiHost;
  }
  return "https://cdn-2.fakeyou.com";
}
