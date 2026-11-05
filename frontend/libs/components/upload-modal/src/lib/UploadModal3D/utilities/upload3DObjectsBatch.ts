import {
  // Per-row status shown in the dialog's file list ("idle" | "converting" | "uploading" | "success" | "error").
  FileEntryStatus,
  // Library bucket for the assets.
  FilterEngineCategories,
  // Optional rig type for characters.
  MediaFileAnimationType,
  // The step names reported by upload3DObjects, used here to tell finished from in-progress.
  UploaderStates,
} from "../../Types";
// The single-file pipeline (asset -> cover image -> attach cover) that this batch runs once per file.
import { upload3DObjects } from "./upload3DObjects";

// Uploads several 3D / splat files at once (all in parallel, via Promise.all) and reports per-row and
// overall progress through callbacks. Used by the 3D and Splat dialogs for multi-file submits and for
// "Retry Failed". It keeps no state outside this call: everything leaves through the three callbacks.
export const upload3DObjectsBatch = async ({
  files,
  thumbnails,
  engineCategory,
  animationType,
  durationsMillis,
  onFileStatusChange,
  onOverallProgress,
  onComplete,
}: {
  // The files to upload; the index into this array is the `index` the status callback reports.
  files: File[];
  // Preview snapshot per file; a file with no entry uploads without a cover.
  thumbnails: Map<File, Blob>;
  // Library bucket for every file in the batch.
  engineCategory: FilterEngineCategories;
  // Optional rig type, applied to every file.
  animationType?: MediaFileAnimationType;
  // Per-file clip durations; required by the backend for animation uploads.
  durationsMillis?: Map<File, number>;
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
  // JS is single-threaded; these counters are safe across concurrent async callbacks.
  // How many files have reached a final state (success or any error).
  let completedCount = 0;
  // How many of those succeeded.
  let successCount = 0;
  // Indices already counted, so a repeated final report for one file is not counted twice.
  const completedIndices = new Set<number>();

  // Mark every row "uploading" up front and reset the counter to 0 / total.
  files.forEach((_, i) => onFileStatusChange(i, "uploading"));
  onOverallProgress(0, files.length);

  try {
    // Start every file's pipeline at once and wait for all of them to settle.
    await Promise.all(
      files.map((file, i) =>
        upload3DObjects({
          // Title = file name without its extension.
          title: file.name.slice(0, file.name.lastIndexOf(".")),
          assetFile: file,
          engineCategory,
          animationType,
          // Each file's own clip length (only present for animation uploads).
          durationMillis: durationsMillis?.get(file),
          // This file's preview snapshot, if one was captured.
          thumbnailSnapshot: thumbnails.get(file),
          // Translate this file's pipeline states into row status and overall progress.
          progressCallback: (state) => {
            // Final success: count it and turn the row green.
            if (state.status === UploaderStates.success) {
              successCount++;
              onFileStatusChange(i, "success");
            } else if (
              // Any failed step (asset upload, cover upload, or cover attach) turns the row red.
              state.status === UploaderStates.assetError ||
              state.status === UploaderStates.coverCreateError ||
              state.status === UploaderStates.coverSetError
            ) {
              onFileStatusChange(i, "error", state.errorMessage);
            }

            // "Finished" = success or any failure; in-progress states (uploadingAsset ...) do not count.
            if (
              state.status === UploaderStates.success ||
              state.status === UploaderStates.assetError ||
              state.status === UploaderStates.coverCreateError ||
              state.status === UploaderStates.coverSetError
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
