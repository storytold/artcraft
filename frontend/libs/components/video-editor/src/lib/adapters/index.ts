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

export type { ProjectStorageAdapter } from "./project-storage";
export type { MediaSourceAdapter } from "./media-source";
export type { AssetGalleryAdapter } from "./asset-gallery";
export type { AuthUserAdapter } from "./auth-user";
export type { ExportSinkAdapter } from "./export-sink";

// Bundle that EditorProvider accepts. `assetGallery` is optional —
// when null/undefined, the editor uses its built-in file picker.
export interface VideoEditorAdapters {
  projectStorage: import("./project-storage").ProjectStorageAdapter;
  mediaSource: import("./media-source").MediaSourceAdapter;
  authUser: import("./auth-user").AuthUserAdapter;
  exportSink: import("./export-sink").ExportSinkAdapter;
  assetGallery?: import("./asset-gallery").AssetGalleryAdapter | null;
}
