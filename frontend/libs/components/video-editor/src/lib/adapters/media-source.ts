import type { MediaHandle, MediaProbe, ResolvedMedia } from "./types";

// Reads and writes media. The editor never opens files itself — it
// hands a `MediaHandle` to this adapter and expects a usable URL back.
// This is the single biggest seam for the future Artcraft integration:
// - artcraft-webapp will route uploads through MediaFilesApi
// - artcraft (Tauri) will route through @storyteller/tauri-api for
//   local file imports and through MediaFilesApi for cloud-stored
//   media.
//
// `probe` is optional. If the host can't provide metadata cheaply, the
// lib falls back to MediaBunny / browser-side decoding to discover
// duration/dimensions.
export interface MediaSourceAdapter {
  resolveMedia(handle: MediaHandle): Promise<ResolvedMedia>;
  uploadLocalFile(file: File): Promise<MediaHandle>;
  probe?(handle: MediaHandle): Promise<MediaProbe>;
  // Called when the editor no longer needs a previously resolved URL.
  // For blob: URLs the default impl revokes them; HTTP-backed impls
  // can no-op.
  releaseResolved?(resolved: ResolvedMedia): void;
}
