// Shared types used across adapter surfaces.

export type MediaKind = "video" | "audio" | "image";

// Opaque reference to a media asset. The lib stores these in
// project state; resolving them to a usable URL goes through the
// MediaSourceAdapter so the host can keep the backing storage
// (filesystem, R2, IndexedDB, Tauri-local-file) opaque to the
// editor.
export interface MediaHandle {
  // Stable id assigned at upload/import time.
  id: string;
  // Discriminator so callers can dispatch on kind without resolving.
  kind: MediaKind;
}

export interface MediaProbe {
  durationMs?: number;
  widthPx?: number;
  heightPx?: number;
  // Best-guess container/codec mime ("video/mp4", "audio/ogg", ...).
  mime?: string;
  // Optional frame rate hint for video assets.
  fps?: number;
}

export interface ResolvedMedia {
  // URL usable as a <video>/<audio>/<img> src. Can be a blob:, file://,
  // https://, or any other scheme the host supports in the active runtime.
  url: string;
  mime: string;
  durationMs?: number;
}

// Lightweight summary of a project — enough to list and choose one
// without loading the whole timeline payload.
export interface ProjectMeta {
  id: string;
  name: string;
  updatedAt: number;
  thumbnailUrl?: string;
}

// The full serialized project. Shape stays opaque to the host — the
// editor reads/writes it as a JSON-stringifiable value. The exact
// inner shape evolves with the timeline/scene format and is not part
// of the adapter contract.
export interface EditorProject {
  id: string;
  name: string;
  updatedAt: number;
  // Editor-controlled payload. Hosts must not touch this.
  data: unknown;
}

export interface AuthUser {
  id: string;
  displayName: string;
}

// What an export job produces. The shape mirrors what a renderer
// would emit; ExportSinkAdapter consumes it.
export interface ExportArtifact {
  // The encoded file as a Blob in browser contexts, or a path/handle
  // the host can interpret in Tauri.
  blob: Blob;
  // Suggested filename, including extension.
  filename: string;
  mime: string;
  durationMs?: number;
}
