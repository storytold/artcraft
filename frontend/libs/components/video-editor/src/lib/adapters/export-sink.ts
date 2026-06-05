import type { ExportArtifact } from "./types";

// Receives the output of the editor's local renderer. Concrete sinks:
// - download to disk (default in-browser impl)
// - save via Tauri dialog (artcraft)
// - upload to Artcraft media library (webapp + Tauri impls)
//
// The editor calls `accept(artifact, options?)` once per finished
// render. Options let the host's export-popover UI pick which
// destinations to send to (disk, library, both); onProgress fires
// per-destination lifecycle events so the UI can render inline
// progress rows while the sinks run. Adapters resolve the returned
// promise only after every requested destination has settled.

export type ExportDestination = "disk" | "library";

export type ExportSinkProgressEvent =
  | { destination: ExportDestination; status: "pending" | "uploading" }
  | { destination: ExportDestination; status: "success" }
  | { destination: ExportDestination; status: "error"; error: string };

export interface ExportSinkOptions {
  // Defaults to `true` when omitted so adapters keep their previous
  // behavior for callers that pre-date the options arg.
  saveToDisk?: boolean;
  // Defaults to `false` — only hosts that wire a real library backend
  // should opt in. The default downloadExportSink ignores this.
  saveToLibrary?: boolean;
  // Fires once per destination as it changes phase. Implementers are
  // expected to call it at least once per requested destination so the
  // UI can transition out of the initial "pending" state.
  onProgress?: (event: ExportSinkProgressEvent) => void;
}

export interface ExportSinkAdapter {
  // Returns the absolute filesystem path of the saved disk artifact
  // when the sink can determine it (e.g. a native save-dialog flow),
  // or `null` otherwise. Browser-download sinks cannot observe the
  // chosen path due to sandboxing and MUST return `null`. Library-only
  // saves also return `null`. The lib does not currently consume the
  // return value — it's surfaced for hosts that want to log or open
  // the saved file.
  accept(
    artifact: ExportArtifact,
    options?: ExportSinkOptions,
  ): Promise<string | null>;
}
