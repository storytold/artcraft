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
  async accept(artifact, options) {
    const saveToDisk = options?.saveToDisk ?? true;
    const onProgress = options?.onProgress;

    // The default sink can't ship to a media library — fail loudly if
    // a caller asks. Hosts that want library upload should swap this
    // adapter for one that supports it.
    if (options?.saveToLibrary) {
      onProgress?.({
        destination: "library",
        status: "error",
        error: "Default export sink has no media library",
      });
    }

    if (!saveToDisk) {
      return null;
    }

    onProgress?.({ destination: "disk", status: "pending" });
    try {
      const url = URL.createObjectURL(artifact.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = artifact.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
      onProgress?.({ destination: "disk", status: "success" });
      return artifact.filename;
    } catch (error) {
      onProgress?.({
        destination: "disk",
        status: "error",
        error: error instanceof Error ? error.message : "Download failed",
      });
      throw error;
    }
  },
};
