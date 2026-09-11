export type DiagnosticSeverity = "caution" | "error";

// Definitions describe a diagnostic without coupling to its check
// implementation — the registration in DiagnosticsManager adds the
// `check(editor)` callback. Scope groups diagnostics so the UI can
// query only the ones relevant to the active context (e.g. "preview"
// vs "timeline" vs "export").
export interface DiagnosticDefinition {
  id: string;
  scope: string;
  severity: DiagnosticSeverity;
  message: string;
}
