import type { ExportSinkAdapter } from "../export-sink";

// Default export sink: triggers a browser download. Hosts can replace
// with a Tauri save-dialog impl or an upload-to-artcraft impl.
export const downloadExportSink: ExportSinkAdapter = {
  async accept(artifact) {
    const url = URL.createObjectURL(artifact.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = artifact.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoke async so the browser has time to start the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return artifact.filename;
  },
};
