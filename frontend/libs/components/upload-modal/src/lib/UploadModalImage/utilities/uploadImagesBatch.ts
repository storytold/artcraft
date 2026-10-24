// Per-row status type for the file list, and the step names reported by uploadImage.
import { FileEntryStatus, UploaderStates } from "../../Types";
// The single-file image pipeline that this batch runs once per file.
import { uploadImage } from "./uploadImage";

// Uploads several images at once (all in parallel, via Promise.all) and reports per-row and overall
// progress through callbacks. The image twin of upload3DObjectsBatch (same shape, but images have no cover
// step, so only `success` and `assetError` are final). Used by the Image dialog for multi-file submits and
// "Retry Failed". It keeps no state outside this call: everything leaves through the three callbacks.
export const uploadImagesBatch = async ({
  files,
  onFileStatusChange,
  onOverallProgress,
  onComplete,
}: {
  // The images to upload; the index into this array is the `index` the status callback reports.
  files: File[];
  // Called when a row changes state: "uploading" at the start, then "success" or "error" (with the message).
  onFileStatusChange: (
    index: number,
    status: FileEntryStatus,
    errorMessage?: string,
  ) => void;
  // Called with (files finished so far, total) to drive the "n / total" counter.
  onOverallProgress: (completed: number, total: number) => void;
  // Called once at the very end: (every file succeeded, at least one file succeeded).
  onComplete: (allSucceeded: boolean, anySucceeded: boolean) => void;
}) => {
  // How many files have reached a final state (success or error).
  let completedCount = 0;
  // How many of those succeeded.
  let successCount = 0;
  // Indices already counted, so a repeated final report for one file is not counted twice.
  const completedIndices = new Set<number>();

  // Mark every row "uploading" up front and reset the counter to 0 / total.
  files.forEach((_, i) => onFileStatusChange(i, "uploading"));
  onOverallProgress(0, files.length);

  try {
    // Start every file's upload at once and wait for all of them to settle.
    await Promise.all(
      files.map((file, i) =>
        uploadImage({
          // Title = file name without its extension.
          title: file.name.slice(0, file.name.lastIndexOf(".")),
          assetFile: file,
          // Translate this file's pipeline states into row status and overall progress.
          progressCallback: (state) => {
            // Final success: count it and turn the row green.
            if (state.status === UploaderStates.success) {
              successCount++;
              onFileStatusChange(i, "success");
            } else if (state.status === UploaderStates.assetError) {
              // The upload failed: turn the row red with the backend's message.
              onFileStatusChange(i, "error", state.errorMessage);
            }

            // "Finished" = success or failure; the in-progress state does not count.
            if (
              state.status === UploaderStates.success ||
              state.status === UploaderStates.assetError
            ) {
              // Count each file only once.
              if (!completedIndices.has(i)) {
                completedIndices.add(i);
                completedCount++;
                onOverallProgress(completedCount, files.length);
              }
            }
          },
        }),
      ),
    );
  } catch (err) {
    // A pipeline threw unexpectedly: mark every file that had not reached a final state as failed, with the
    // error's message (or a generic one). Files that already finished keep their own status.
    files.forEach((_, i) => {
      if (!completedIndices.has(i)) {
        onFileStatusChange(
          i,
          "error",
          err instanceof Error ? err.message : "Unexpected error",
        );
      }
    });
  }

  // Report the outcome once, after every file has settled.
  onComplete(successCount === files.length, successCount > 0);
};
