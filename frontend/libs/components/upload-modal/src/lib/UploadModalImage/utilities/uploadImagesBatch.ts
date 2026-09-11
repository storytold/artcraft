import { FileEntryStatus, UploaderStates } from "../../Types";
import { uploadImage } from "./uploadImage";

export const uploadImagesBatch = async ({
  files,
  onFileStatusChange,
  onOverallProgress,
  onComplete,
}: {
  files: File[];
  onFileStatusChange: (
    index: number,
    status: FileEntryStatus,
    errorMessage?: string,
  ) => void;
  onOverallProgress: (completed: number, total: number) => void;
  onComplete: (allSucceeded: boolean, anySucceeded: boolean) => void;
}) => {
  let completedCount = 0;
  let successCount = 0;
  const completedIndices = new Set<number>();

  files.forEach((_, i) => onFileStatusChange(i, "uploading"));
  onOverallProgress(0, files.length);

  try {
    await Promise.all(
      files.map((file, i) =>
        uploadImage({
          title: file.name.slice(0, file.name.lastIndexOf(".")),
          assetFile: file,
          progressCallback: (state) => {
            if (state.status === UploaderStates.success) {
              successCount++;
              onFileStatusChange(i, "success");
            } else if (state.status === UploaderStates.assetError) {
              onFileStatusChange(i, "error", state.errorMessage);
            }

            if (
              state.status === UploaderStates.success ||
              state.status === UploaderStates.assetError
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
