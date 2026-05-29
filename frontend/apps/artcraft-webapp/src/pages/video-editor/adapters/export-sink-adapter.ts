import type {
  ExportArtifact,
  ExportSinkAdapter,
} from "@storyteller/ui-video-editor";
import { kindFromMime } from "@storyteller/ui-video-editor";
import { showToast } from "../../../components/toast/toast";
import { uploadByKind } from "./upload-by-kind";

// Webapp ExportSinkAdapter — downloads the export to disk immediately
// (matching the lib's default behavior so the user always gets the
// file) and kicks off a fire-and-forget upload to the Artcraft media
// library so the rendered video also shows up in their gallery.
//
// Upload failures are reported via toast but don't fail the export —
// the download already happened, so the user has the file regardless.

// Trigger the browser download for the rendered artifact and return
// the freshly-minted object URL so the caller can revoke it AFTER the
// background upload finishes (avoids racing the disk write or yanking
// the Blob ref out from under a concurrent UploadNewVideo).
//
// Inlined here rather than composing with the lib's downloadExportSink
// because that adapter revokes the URL itself before returning, which
// we explicitly don't want — we need to keep the URL alive while the
// upload is in-flight. Behavior is otherwise the same as
// downloadExportSink.accept().
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
// UploadNewVideo / UploadAudio / UploadImage calls for the same Blob;
// both succeed, the user's library ends up with two identical entries
// and the user sees duplicate success toasts.
const inFlight = new Set<string>();

export const webappExportSinkAdapter: ExportSinkAdapter = {
  async accept(artifact) {
    const downloadUrl = triggerDownload(artifact);

    if (inFlight.has(artifact.filename)) {
      // Download still happens (user pressed Export, they should get
      // the file). Just skip the duplicate upload + toast.
      // Revoke the URL after a brief delay — no upload to chain to.
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      return artifact.filename;
    }
    inFlight.add(artifact.filename);

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
        inFlight.delete(artifact.filename);
        URL.revokeObjectURL(downloadUrl);
      });

    return artifact.filename;
  },
};
