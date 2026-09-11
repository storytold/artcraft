// Default adapter implementations — let the lib run end-to-end with
// no host wiring. Hosts opt out of any of these by passing their own
// implementation into EditorProvider.

import { createIndexedDBProjectStorage } from "./indexeddb-project-storage";
import { createLocalFileMediaSource } from "./local-file-media-source";
import { anonymousAuthUser } from "./anonymous-auth-user";
import { downloadExportSink } from "./download-export-sink";
import { consoleToast } from "./console-toast";
import { emptySoundsAdapter } from "./empty-sounds-adapter";
import type { VideoEditorAdapters } from "../index";

export { createIndexedDBProjectStorage } from "./indexeddb-project-storage";
export { createLocalFileMediaSource } from "./local-file-media-source";
export { anonymousAuthUser } from "./anonymous-auth-user";
export { downloadExportSink } from "./download-export-sink";
export { consoleToast } from "./console-toast";
export { emptySoundsAdapter } from "./empty-sounds-adapter";

// Convenience: a fully-wired default bundle. Useful for tests and
// for the standalone-lib smoke test in artcraft-webapp.
export function createDefaultAdapters(): VideoEditorAdapters {
  return {
    projectStorage: createIndexedDBProjectStorage(),
    mediaSource: createLocalFileMediaSource(),
    authUser: anonymousAuthUser,
    exportSink: downloadExportSink,
    toast: consoleToast,
    soundsAdapter: emptySoundsAdapter,
    assetGallery: null,
  };
}
