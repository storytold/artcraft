import type { MediaHandle, MediaKind } from "./types";

// Optional slot for a host-provided asset picker (e.g. Artcraft's
// existing gallery modal). When this adapter is null/absent, the
// editor falls back to its built-in local-file picker. When present,
// the editor's "Browse gallery" button calls `openPicker` and
// receives one or more `MediaHandle`s back, which the editor adds
// to the project's media bin.
//
// Phase 2 wiring: artcraft will inject a real impl that delegates to
// `@storyteller/ui-gallery-modal`.
export interface AssetGalleryAdapter {
  openPicker(opts: { kinds: MediaKind[] }): Promise<MediaHandle[]>;
}
