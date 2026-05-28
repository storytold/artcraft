import type { ExportArtifact } from "./types";

// Receives the output of the editor's local renderer. Concrete sinks:
// - download to disk (default in-browser impl)
// - save via Tauri dialog (artcraft)
// - upload to Artcraft media library (phase 2)
//
// The editor calls `accept(artifact)` once per finished render. The
// adapter decides what to do with it and returns either an opaque
// destination string (e.g. file path, URL) or null if the operation
// is fire-and-forget.
export interface ExportSinkAdapter {
  accept(artifact: ExportArtifact): Promise<string | null>;
}
