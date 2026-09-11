import type { MediaHandle, MediaKind } from "./types";

// Optional slot for a host-provided asset picker (e.g. Artcraft's
// existing gallery modal). When this adapter is null/absent, the
// editor's "Browse gallery" button is hidden. When present, the button
// is shown and clicking it calls `openPicker`. Each returned selection
// carries the handle plus a display name (read from the host's gallery
// metadata) so the editor doesn't have to re-fetch it via resolveMedia
// just to label the asset in the media bin.
export interface MediaPickerSelection {
  handle: MediaHandle;
  name: string;
}

export interface AssetGalleryAdapter {
  openPicker(opts: { kinds: MediaKind[] }): Promise<MediaPickerSelection[]>;
}
