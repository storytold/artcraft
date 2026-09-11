import type { MediaKind } from "./types";

// Map a mime type to a MediaKind discriminator. Exposed as part of the
// public API so every MediaSourceAdapter (default, webapp, Tauri, etc.)
// shares one classifier and stays in lockstep if MediaKind ever
// expands.
export function kindFromMime(mime: string): MediaKind {
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "image";
}
