// Public API for @storyteller/ui-video-editor.
//
// Phase 1: lib skeleton + adapter scaffolding. As the OpenCut Classic
// port lands, this file gains the full surface (stores, controllers,
// action dispatchers, components).

// Top-level component
export { VideoEditor } from "./lib/VideoEditor";
export type { VideoEditorProps } from "./lib/VideoEditor";

// Provider + hook (use only when mounting the inner shell directly)
export { EditorProvider, useEditorAdapters } from "./lib/EditorProvider";
export type { EditorProviderProps } from "./lib/EditorProvider";

// Adapter interfaces — hosts implement these
export type {
  MediaKind,
  MediaHandle,
  MediaProbe,
  ResolvedMedia,
  ProjectMeta,
  EditorProject,
  AuthUser,
  ExportArtifact,
  ProjectStorageAdapter,
  MediaSourceAdapter,
  AssetGalleryAdapter,
  AuthUserAdapter,
  ExportSinkAdapter,
  VideoEditorAdapters,
} from "./lib/adapters";

// Default adapters — useful for tests and as a baseline for hosts
// that want to mix in just one Artcraft-specific implementation.
export {
  createDefaultAdapters,
  createIndexedDBProjectStorage,
  createLocalFileMediaSource,
  anonymousAuthUser,
  downloadExportSink,
} from "./lib/adapters/default";
