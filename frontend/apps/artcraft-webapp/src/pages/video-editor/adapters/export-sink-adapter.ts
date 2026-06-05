import type {
  ExportArtifact,
  ExportSinkAdapter,
  ExportSinkOptions,
} from "@storyteller/ui-video-editor";
import { kindFromMime } from "@storyteller/ui-video-editor";
import { uploadByKind } from "./upload-by-kind";

// Webapp ExportSinkAdapter.
//
// Two destinations the user can pick independently from the export
// popover: a browser download (`saveToDisk`) and an Artcraft media
// library upload (`saveToLibrary`). The progress callback fires once
// per destination so the lib can render inline status rows; accept()
// resolves only after every requested destination has settled so the
// "Close" button in the popover only appears when everything is done.
//
// accept() always returns `null`: the browser's <a download> flow
// does not expose the actual on-disk path, so callers that want a
// real path must use the Tauri adapter instead. This matches the
// ExportSinkAdapter contract.

function triggerDownload(artifact: ExportArtifact): string {
  const url = URL.createObjectURL(artifact.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = artifact.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return url;
}

async function uploadToLibrary(artifact: ExportArtifact): Promise<void> {
  const baseTitle = artifact.filename.replace(/\.[^.]+$/, "");
  await uploadByKind({
    kind: kindFromMime(artifact.mime),
    blob: artifact.blob,
    fileName: artifact.filename,
    title: baseTitle,
  });
}

// In-flight gate keyed by filename. Without this, double-clicking
// Export or any concurrent invocation launches two simultaneous
// UploadNewVideo / UploadAudio / UploadImage calls for the same Blob.
const inFlight = new Set<string>();

export const webappExportSinkAdapter: ExportSinkAdapter = {
  async accept(artifact, options) {
    const saveToDisk = options?.saveToDisk ?? true;
    const saveToLibrary = options?.saveToLibrary ?? false;
    const onProgress = options?.onProgress;

    if (!saveToDisk && !saveToLibrary) {
      return null;
    }

    // Disk: download is effectively synchronous; we still emit a
    // pending → success transition so the popover row can render the
    // spinner-to-checkmark animation rather than snapping straight to
    // success.
    let downloadUrl: string | null = null;
    if (saveToDisk) {
      onProgress?.({ destination: "disk", status: "pending" });
      try {
        downloadUrl = triggerDownload(artifact);
        onProgress?.({ destination: "disk", status: "success" });
      } catch (error) {
        onProgress?.({
          destination: "disk",
          status: "error",
          error: error instanceof Error ? error.message : "Download failed",
        });
      }
    }

    if (!saveToLibrary) {
      // Disk-only path: schedule blob URL revoke and return. The 60s
      // delay outlasts large file writes on slow disks.
      if (downloadUrl) {
        setTimeout(() => URL.revokeObjectURL(downloadUrl as string), 60_000);
      }
      return null;
    }

    // Library path. Dedupe concurrent invocations of the same artifact
    // so a double-click doesn't double-upload.
    if (inFlight.has(artifact.filename)) {
      onProgress?.({
        destination: "library",
        status: "error",
        error: "Already uploading this export",
      });
      if (downloadUrl) {
        setTimeout(() => URL.revokeObjectURL(downloadUrl as string), 60_000);
      }
      return null;
    }
    inFlight.add(artifact.filename);

    onProgress?.({ destination: "library", status: "uploading" });
    try {
      await uploadToLibrary(artifact);
      onProgress?.({ destination: "library", status: "success" });
    } catch (error) {
      onProgress?.({
        destination: "library",
        status: "error",
        error: error instanceof Error ? error.message : "Upload failed",
      });
    } finally {
      inFlight.delete(artifact.filename);
      // Revoke after the upload settles so the parallel disk write
      // and the library read can't race against the URL release.
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    }

    return null;
  },
};

// Helper re-exported so other adapters in this folder can build their
// own ExportSinkOptions when delegating to the webapp adapter.
export type { ExportSinkOptions };
