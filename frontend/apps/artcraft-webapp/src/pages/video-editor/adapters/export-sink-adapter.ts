import type {
  ExportArtifact,
  ExportSinkAdapter,
} from "@storyteller/ui-video-editor";
import { MediaUploadApi } from "@storyteller/api";
import { showToast } from "../../../components/toast/toast";

// Webapp ExportSinkAdapter — downloads the export to disk immediately
// (matching the lib's default behavior so the user always gets the
// file) and kicks off a fire-and-forget upload to the Artcraft media
// library so the rendered video also shows up in their gallery.
//
// Upload failures are reported via toast but don't fail the export —
// the download already happened, so the user has the file regardless.

const uploadApi = new MediaUploadApi();

// Returns the freshly-minted object URL so the caller can revoke it
// AFTER the background upload finishes. Revoking on a fixed 1s timer
// races the disk write for large exports (AV scan, low-end SSD) and
// can also yank the Blob reference out from under a concurrent
// UploadNewVideo that's still reading from the same Blob.
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
  const uuid = crypto.randomUUID();
  const baseTitle = artifact.filename.replace(/\.[^.]+$/, "");
  const isVideo = artifact.mime.startsWith("video/");
  const isAudio = artifact.mime.startsWith("audio/");

  const response = isVideo
    ? await uploadApi.UploadNewVideo({
        uuid,
        blob: artifact.blob,
        fileName: artifact.filename,
        maybe_title: baseTitle,
      })
    : isAudio
      ? await uploadApi.UploadAudio({
          uuid,
          blob: artifact.blob,
          fileName: artifact.filename,
          maybe_title: baseTitle,
        })
      : await uploadApi.UploadImage({
          uuid,
          blob: artifact.blob,
          fileName: artifact.filename,
          maybe_title: baseTitle,
        });

  if (!response.success) {
    throw new Error(response.errorMessage || "Upload failed");
  }
}

export const webappExportSinkAdapter: ExportSinkAdapter = {
  async accept(artifact) {
    const downloadUrl = triggerDownload(artifact);

    // Don't await — let the upload happen in the background so the
    // export popover can close immediately. Surface success/failure
    // via toast. Revoke the download URL only after the upload settles
    // so that (a) the browser has finished initiating the download and
    // (b) the upload isn't reading from a Blob whose URL has already
    // been torn down.
    void uploadToLibrary(artifact)
      .then(() => {
        showToast(
          "success",
          `Saved ${artifact.filename} to your media library`,
        );
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        showToast(
          "error",
          `Couldn't save ${artifact.filename} to your media library: ${message}`,
        );
      })
      .finally(() => {
        URL.revokeObjectURL(downloadUrl);
      });

    return artifact.filename;
  },
};
