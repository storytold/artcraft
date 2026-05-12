import {
  FileEntryStatus,
  FilterEngineCategories,
  MediaFileAnimationType,
  UploaderStates,
} from "../../Types";
import { upload3DObjects } from "./upload3DObjects";

export const upload3DObjectsBatch = async ({
  files,
  thumbnails,
  engineCategory,
  animationType,
  onFileStatusChange,
  onOverallProgress,
  onComplete,
}: {
  files: File[];
  thumbnails: Map<File, Blob>;
  engineCategory: FilterEngineCategories;
  animationType?: MediaFileAnimationType;
  onFileStatusChange: (
    index: number,
    status: FileEntryStatus,
    errorMessage?: string,
  ) => void;
  onOverallProgress: (completed: number, total: number) => void;
  onComplete: (allSucceeded: boolean, anySucceeded: boolean) => void;
}) => {
  // JS is single-threaded; these counters are safe across concurrent async callbacks.
  let completedCount = 0;
  let successCount = 0;
  const completedIndices = new Set<number>();

  files.forEach((_, i) => onFileStatusChange(i, "uploading"));
  onOverallProgress(0, files.length);

  try {
    await Promise.all(
      files.map((file, i) =>
        upload3DObjects({
          title: file.name.slice(0, file.name.lastIndexOf(".")),
          assetFile: file,
          engineCategory,
          animationType,
          thumbnailSnapshot: thumbnails.get(file),
          progressCallback: (state) => {
            if (state.status === UploaderStates.success) {
              successCount++;
              onFileStatusChange(i, "success");
            } else if (
              state.status === UploaderStates.assetError ||
              state.status === UploaderStates.coverCreateError ||
              state.status === UploaderStates.coverSetError
            ) {
              onFileStatusChange(i, "error", state.errorMessage);
            }

            if (
              state.status === UploaderStates.success ||
              state.status === UploaderStates.assetError ||
              state.status === UploaderStates.coverCreateError ||
              state.status === UploaderStates.coverSetError
            ) {
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

  onComplete(successCount === files.length, successCount > 0);
};
