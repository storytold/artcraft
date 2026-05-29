import type { ExportSinkAdapter } from "../export-sink";

// Default export sink: triggers a browser download. Hosts can replace
// with a Tauri save-dialog impl or an upload-to-artcraft impl.
//
// The revoke window has to outlast both the browser's initial fetch
// of the URL (which can be delayed by AV scanning on Windows) and the
// disk write for the full Blob (slow on HDDs / low-end SSDs for
// multi-GB exports). One minute is generous but safe — the Blob is
// only held in memory until the URL revokes, so a tab open for an
// hour still releases everything within a minute of each export.
const REVOKE_DELAY_MS = 60_000;

export const downloadExportSink: ExportSinkAdapter = {
  async accept(artifact) {
    const url = URL.createObjectURL(artifact.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = artifact.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
    return artifact.filename;
  },
};
