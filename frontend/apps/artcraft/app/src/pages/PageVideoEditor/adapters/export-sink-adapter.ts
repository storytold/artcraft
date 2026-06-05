import type {
  ExportArtifact,
  ExportSinkAdapter,
} from "@storyteller/ui-video-editor";
import { kindFromMime } from "@storyteller/ui-video-editor";
import {
  promptDownloadLocationIfNeeded,
  downloadUrlToPath,
} from "@storyteller/api";
import { downloadDir } from "@tauri-apps/api/path";
import { uploadByKind } from "./upload-by-kind";

// Tauri ExportSinkAdapter.
//
// Two destinations the user controls from the export popover:
//   - saveToDisk: native save-as dialog (promptDownloadLocationIfNeeded
//     falls back to the OS Downloads dir when the "Ask location before
//     download" setting is off) → downloadUrlToPath writes the file.
//   - saveToLibrary: UploadNewVideo / UploadAudio / UploadImage mirrors
//     the render into the user's Artcraft media library.
//
// Progress events fire per destination so the lib's popover can render
// inline status rows; accept() resolves only after every requested
// destination settled. In-flight Set dedupes concurrent invocations.
//
// Return value: the absolute path of the file written to disk when
// saveToDisk succeeded, otherwise `null`. Matches the
// ExportSinkAdapter contract — the webapp adapter always returns
// `null` because the browser can't observe the chosen download path.

const inFlight = new Set<string>();

async function ensureSavePath(
  url: string,
  filename: string,
): Promise<string | null> {
  const chosen = await promptDownloadLocationIfNeeded(url);
  if (chosen === null) {
    // User explicitly cancelled the dialog.
    return null;
  }
  if (typeof chosen === "string") return chosen;
  // "Ask location before download" is off — default to Downloads/<filename>.
  const dir = await downloadDir();
  return `${dir}/${filename}`;
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

export const tauriExportSinkAdapter: ExportSinkAdapter = {
  async accept(artifact, options) {
    const saveToDisk = options?.saveToDisk ?? true;
    const saveToLibrary = options?.saveToLibrary ?? false;
    const onProgress = options?.onProgress;

    if (!saveToDisk && !saveToLibrary) {
      return null;
    }

    const downloadUrl = URL.createObjectURL(artifact.blob);

    if (inFlight.has(artifact.filename)) {
      if (saveToDisk) {
        onProgress?.({
          destination: "disk",
          status: "error",
          error: "Already saving this export",
        });
      }
      if (saveToLibrary) {
        onProgress?.({
          destination: "library",
          status: "error",
          error: "Already uploading this export",
        });
      }
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
      return null;
    }
    inFlight.add(artifact.filename);

    let savedPath: string | null = null;
    try {
      if (saveToDisk) {
        onProgress?.({ destination: "disk", status: "pending" });
        try {
          const targetPath = await ensureSavePath(downloadUrl, artifact.filename);
          if (targetPath) {
            await downloadUrlToPath(downloadUrl, targetPath);
            savedPath = targetPath;
            onProgress?.({ destination: "disk", status: "success" });
          } else {
            // User cancelled the dialog — treat as error so the row
            // doesn't look like a silent success.
            onProgress?.({
              destination: "disk",
              status: "error",
              error: "Save dialog cancelled",
            });
          }
        } catch (error) {
          console.error("Export disk save failed:", error);
          onProgress?.({
            destination: "disk",
            status: "error",
            error: error instanceof Error ? error.message : "Disk save failed",
          });
        }
      }

      if (saveToLibrary) {
        onProgress?.({ destination: "library", status: "uploading" });
        try {
          await uploadToLibrary(artifact);
          onProgress?.({ destination: "library", status: "success" });
        } catch (error) {
          console.error("Export library upload failed:", error);
          onProgress?.({
            destination: "library",
            status: "error",
            error: error instanceof Error ? error.message : "Upload failed",
          });
        }
      }
    } finally {
      inFlight.delete(artifact.filename);
      URL.revokeObjectURL(downloadUrl);
    }

    return savedPath;
  },
};
