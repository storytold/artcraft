// Adapter interfaces — the seam between the lib and its host (apps,
// artcraft, artcraft-webapp). Hosts implement these and pass them
// into `EditorProvider`. Defaults live in `./default/`.

export type {
  MediaKind,
  MediaHandle,
  MediaProbe,
  ResolvedMedia,
  ProjectMeta,
  EditorProject,
  AuthUser,
  ExportArtifact,
} from "./types";

export { kindFromMime } from "./kind-from-mime";
export type { ProjectStorageAdapter } from "./project-storage";
export type { MediaSourceAdapter } from "./media-source";
export type {
  AssetGalleryAdapter,
  MediaPickerSelection,
} from "./asset-gallery";
export type { AuthUserAdapter } from "./auth-user";
export type {
  ExportSinkAdapter,
  ExportSinkOptions,
  ExportSinkProgressEvent,
  ExportDestination,
} from "./export-sink";
export type { ToastAdapter, ToastOptions } from "./toast";
export type { SoundsAdapter, SoundsSearchResult } from "./sounds";

// Bundle that EditorProvider accepts. `assetGallery` is optional —
// when null/undefined, the editor uses its built-in file picker.
export interface VideoEditorAdapters {
  projectStorage: import("./project-storage").ProjectStorageAdapter;
  mediaSource: import("./media-source").MediaSourceAdapter;
  authUser: import("./auth-user").AuthUserAdapter;
  exportSink: import("./export-sink").ExportSinkAdapter;
  toast: import("./toast").ToastAdapter;
  soundsAdapter: import("./sounds").SoundsAdapter;
  assetGallery?: import("./asset-gallery").AssetGalleryAdapter | null;
}
