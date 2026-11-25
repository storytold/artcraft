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
  durationsMillis,
  onFileStatusChange,
  onOverallProgress,
  onComplete,
}: {
  files: File[];
  thumbnails: Map<File, Blob>;
  engineCategory: FilterEngineCategories;
  animationType?: MediaFileAnimationType;
  // Per-file clip durations; required by the backend for animation uploads.
  durationsMillis?: Map<File, number>;
  onFileStatusChange: (
    index: number,
    status: FileEntryStatus,
    errorMessage?: string,
  ) => void;
  onOverallProgress: (completed: number, total: number) => void;
  onComplete: (allSucceeded: boolean, anySucceeded: boolean) => void;
}) => {
  let successCount = 0;
  const completedIndices = new Set<number>();

  const finishFile = (
    index: number,
    status: "success" | "error",
    errorMessage?: string,
  ) => {
    if (completedIndices.has(index)) return;
    completedIndices.add(index);
    if (status === "success") successCount++;
    onFileStatusChange(index, status, errorMessage);
    onOverallProgress(completedIndices.size, files.length);
  };

  files.forEach((_, i) => onFileStatusChange(i, "uploading"));
  onOverallProgress(0, files.length);

  await Promise.all(
    files.map((file, i) =>
      upload3DObjects({
        title: file.name.slice(0, file.name.lastIndexOf(".")),
        assetFile: file,
        engineCategory,
        animationType,
        durationMillis: durationsMillis?.get(file),
        thumbnailSnapshot: thumbnails.get(file),
        progressCallback: (state) => {
          if (state.status === UploaderStates.success) {
            finishFile(i, "success");
          } else if (
            state.status === UploaderStates.assetError ||
            state.status === UploaderStates.coverCreateError ||
            state.status === UploaderStates.coverSetError
          ) {
            finishFile(i, "error", state.errorMessage);
          }
        },
      }).catch((err: unknown) => {
        finishFile(
          i,
          "error",
          err instanceof Error ? err.message : "Unexpected error",
        );
      }),
    ),
  );

  onComplete(successCount === files.length, successCount > 0);
};
