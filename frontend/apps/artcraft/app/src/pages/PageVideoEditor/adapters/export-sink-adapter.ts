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
import { ToastTypes } from "~/enums";
import { addToast } from "~/signals/toasts";
import { uploadByKind } from "./upload-by-kind";

// Tauri ExportSinkAdapter.
//
// 1. Mint a blob URL for the rendered artifact.
// 2. Call promptDownloadLocationIfNeeded — pops a native save-as dialog
//    when the user enabled "Ask location before download" in app
//    settings. Falls back to `~/Downloads/<filename>` otherwise.
// 3. downloadUrlToPath writes the file to the chosen path. If the user
//    cancelled the save dialog (chosen === null), skip the disk write.
// 4. Fire-and-forget UploadNewVideo / UploadAudio / UploadImage so the
//    finished render also lands in the user's Artcraft media library.
// 5. Revoke the blob URL only after BOTH operations settle so the
//    upload doesn't read a Blob whose URL was torn down early.
//
// In-flight Set on filename dedupes concurrent invocations (rapid
// double-click on Export).

const inFlight = new Set<string>();

function emitToast(type: ToastTypes, message: string): void {
  addToast(type, message);
}

async function ensureSavePath(url: string, filename: string): Promise<string | null> {
  const chosen = await promptDownloadLocationIfNeeded(url);
  if (chosen === null) {
    // User explicitly cancelled the dialog. Skip the disk write —
    // upload still runs so they can grab the result from the gallery.
    return null;
  }
  if (typeof chosen === "string") return chosen;
  // Toggle is off: default to Downloads/<filename>.
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
  async accept(artifact) {
    const downloadUrl = URL.createObjectURL(artifact.blob);

    if (inFlight.has(artifact.filename)) {
      // Don't double-upload. The disk write would also duplicate
      // (overwrite the same file at the same path), so skip both.
      // Schedule a delayed revoke since there's no upload to tie it to.
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
      return artifact.filename;
    }
    inFlight.add(artifact.filename);

    // Disk write — synchronously block accept() until the path is
    // chosen so the editor's UI reflects the cancel-vs-save state.
    let savedPath: string | null = null;
    try {
      const targetPath = await ensureSavePath(downloadUrl, artifact.filename);
      if (targetPath) {
        await downloadUrlToPath(downloadUrl, targetPath);
        savedPath = targetPath;
      }
    } catch (error) {
      console.error("Export disk save failed:", error);
      const message =
        error instanceof Error ? error.message : "Unknown error";
      emitToast(ToastTypes.ERROR, `Couldn't save export to disk: ${message}`);
    }

    // Library mirror runs detached so the user gets the file regardless
    // of upload outcome.
    void uploadToLibrary(artifact)
      .then(() => {
        emitToast(
          ToastTypes.SUCCESS,
          `Saved ${artifact.filename} to your media library`,
        );
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        emitToast(
          ToastTypes.ERROR,
          `Couldn't save ${artifact.filename} to your media library: ${message}`,
        );
      })
      .finally(() => {
        inFlight.delete(artifact.filename);
        URL.revokeObjectURL(downloadUrl);
      });

    return savedPath ?? artifact.filename;
  },
};
