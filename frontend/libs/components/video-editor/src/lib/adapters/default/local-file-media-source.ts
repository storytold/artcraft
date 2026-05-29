import type { MediaSourceAdapter } from "../media-source";
import type { MediaHandle, ResolvedMedia } from "../types";
import { kindFromMime } from "../kind-from-mime";

// Default media source: keeps File objects in memory and hands out
// blob: URLs. Persists nothing across reloads — projects only stay
// usable as long as the user keeps the browser tab open.
//
// Sufficient for the standalone-lib smoke test. Real hosts (artcraft,
// artcraft-webapp) swap this for an Artcraft-backed adapter.

interface Entry {
  handle: MediaHandle;
  file: File;
  blobUrl: string;
  resolved: ResolvedMedia;
}

function newId(): string {
  return `media_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function createLocalFileMediaSource(): MediaSourceAdapter {
  const byId = new Map<string, Entry>();

  return {
    async resolveMedia(handle) {
      const entry = byId.get(handle.id);
      if (!entry) {
        throw new Error(`MediaHandle ${handle.id} is not loaded`);
      }
      return entry.resolved;
    },
    async uploadLocalFile(file) {
      const id = newId();
      const blobUrl = URL.createObjectURL(file);
      const handle: MediaHandle = { id, kind: kindFromMime(file.type) };
      const resolved: ResolvedMedia = {
        url: blobUrl,
        mime: file.type || "application/octet-stream",
      };
      byId.set(id, { handle, file, blobUrl, resolved });
      return handle;
    },
    releaseResolved(resolved) {
      // Only safe to revoke when no live entry still points at this URL.
      for (const entry of byId.values()) {
        if (entry.resolved.url === resolved.url) return;
      }
      URL.revokeObjectURL(resolved.url);
    },
  };
}
