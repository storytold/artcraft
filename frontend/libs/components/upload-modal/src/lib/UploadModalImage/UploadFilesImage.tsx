// The picker screen inside the "Upload image" dialog (UploadModalImage.tsx renders this while the dialog is in its
// `ready` state). It lets the person choose one or many image files, shows a preview, uploads them, and reports the
// outcome to the dialog through `onUploadProgress`. A multi-file upload stays on this screen and shows per-row status.
import { useEffect, useState } from "react";
// A resizable two-column layout (file list on the left, preview on the right) used only when several files are chosen.
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
// The app's shared button component.
import { Button } from "@storyteller/ui-button";
// The shared drag-and-drop / click-to-browse file chooser (it wraps react-drag-drop-files).
import { FileUploader } from "@storyteller/ui-file-uploader";
// Small icons: row status marks (loader / check / alert), the Retry arrow, the Remove cross, and the preview arrows.
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, CircleAlertIcon, LoaderIcon, RotateCwIcon, XIcon } from "lucide-react";
// Uploads ONE image through the three-step API flow and reports progress as an UploaderState.
import { uploadImage } from "./utilities/uploadImage";
// Uploads several images at the same time (Promise.all) and reports per-file status instead of an UploaderState.
import { uploadImagesBatch } from "./utilities/uploadImagesBatch";
// Shared types: the per-row status words, the dialog's state object, and its numeric state enum.
import {
  FileEntryStatus,
  UploaderState,
  UploaderStates,
} from "../Types";

// One row of the file list: the file itself, where it is in its upload, and the error text if it failed.
interface FileEntry {
  file: File;
  status: FileEntryStatus;
  errorMessage?: string;
}

// What the dialog hands to this picker.
interface Props {
  // Passed in by the dialog but not used here (the dialog's shell draws the title itself).
  title: string;
  // Extensions the file chooser accepts, such as ["png", "jpg"].
  fileTypes: string[];
  // Files to start with (for example files dropped on the app window before the dialog opened). Read on mount only.
  initialFiles?: File[];
  // Closes the dialog (the Cancel button).
  onClose: () => void;
  // Tells the dialog how the upload went. The dialog swaps screens on `success` and `assetError`.
  onUploadProgress: (newState: UploaderState) => void;
}

export const UploadFilesImage = ({
  fileTypes,
  initialFiles,
  onClose,
  onUploadProgress,
}: Props) => {
  // `initialFiles` may be undefined; treat that as an empty list.
  const seedFiles = initialFiles ?? [];

  // The list of chosen files with their upload status. It is seeded from `initialFiles` on the first render only;
  // after that the file chooser (handleFilesChange) is the only thing that replaces the list.
  const [fileEntries, setFileEntries] = useState<FileEntry[]>(
    seedFiles.map((f) => ({ file: f, status: "idle" }))
  );
  // Which row's image is shown in the preview.
  const [previewIndex, setPreviewIndex] = useState(0);
  // A temporary browser URL (blob:) for the previewed file, or null when there is nothing to show.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Incremented on every handleFilesChange so useEffect re-runs even when count stays the same
  const [filesVersion, setFilesVersion] = useState(0);
  // True while a batch (Upload or Retry Failed) is running. A single-row Retry does not set this; it only marks its row.
  const [isUploading, setIsUploading] = useState(false);
  // The "Uploading n / total..." counter, or null before the first batch.
  const [overallProgress, setOverallProgress] = useState<{ current: number; total: number } | null>(null);
  // The red message shown above the list when Upload is pressed with nothing chosen.
  const [selectionError, setSelectionError] = useState<string | undefined>();

  // Make (and later free) the preview URL whenever the previewed row changes or the list is replaced.
  useEffect(() => {
    // The file in the row being previewed.
    const currentFile = fileEntries[previewIndex]?.file;
    // Empty list (or the row was removed): clear the preview.
    if (!currentFile) {
      setPreviewUrl(null);
      return;
    }
    // Ask the browser for a temporary URL that points at the file's bytes in memory.
    const url = URL.createObjectURL(currentFile);
    setPreviewUrl(url);
    // When the effect re-runs or the component unmounts, release the URL so the file's memory can be freed.
    return () => URL.revokeObjectURL(url);
    // `fileEntries` is left out of the list on purpose: status changes (uploading, success, error) must not rebuild
    // the URL, because the <img> would reload and flicker. Replacing the list always bumps `filesVersion` instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewIndex, filesVersion]);

  // Set one row's status (and its error text). Rows are addressed by their position in `fileEntries`.
  const updateFileStatus = (
    index: number,
    status: FileEntryStatus,
    errorMessage?: string
  ) => {
    // Functional update: it always starts from the latest list, so overlapping status reports do not overwrite each other.
    setFileEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, status, errorMessage } : entry
      )
    );
  };

  // Drop a row from the list (the X button, shown only on rows that have not started uploading).
  const removeFile = (index: number) => {
    setFileEntries((prev) => {
      // The list without the removed row.
      const next = prev.filter((_, i) => i !== index);
      // Keep the preview pointing at a row that still exists (the last one if the previewed row was the last).
      setPreviewIndex((prevIdx) => Math.min(prevIdx, Math.max(0, next.length - 1)));
      return next;
    });
    // Rebuild the preview URL even if the index number did not change (a different file now sits at that index).
    setFilesVersion((v) => v + 1);
  };

  // The small Retry arrow on a failed row: upload just that file again.
  const retrySingleFile = async (index: number) => {
    // The row to retry; ignore a stale click for a row that is gone or is already uploading.
    const entry = fileEntries[index];
    if (!entry || entry.status === "uploading") return;
    // Show the spinner on this row only.
    updateFileStatus(index, "uploading");
    // Upload with the same call a lone-file upload uses, but turn its progress into this row's status instead of
    // passing it to the dialog. (This path never calls `onUploadProgress`; see N-101 in BUGS.md.)
    await uploadImage({
      // The library title is the file name without its extension.
      title: entry.file.name.slice(0, entry.file.name.lastIndexOf(".")),
      assetFile: entry.file,
      progressCallback: (state) => {
        if (state.status === UploaderStates.success) {
          updateFileStatus(index, "success");
        } else if (state.status === UploaderStates.assetError) {
          updateFileStatus(index, "error", state.errorMessage);
        }
      },
    });
  };

  // Called by the file chooser with the complete new selection (it replaces the list, it does not append).
  const handleFilesChange = (files: File[]) => {
    // A batch (or a single-row Retry) is still uploading. Its status callbacks report by ROW NUMBER, so swapping the
    // list now would tick the new, never-uploaded rows green and bring the Upload button back for a second batch that
    // races the first. Keep the current list until the upload ends; the picker is not disabled because the
    // react-drag-drop-files drop handler ignores its `disabled` flag, so this guard is the only thing that holds.
    if (isUploading || fileEntries.some((e) => e.status === "uploading")) return;
    // Start a fresh list: every row idle, preview back on the first row, old messages and counters cleared.
    setFileEntries(files.map((f) => ({ file: f, status: "idle" })));
    setPreviewIndex(0);
    setFilesVersion((v) => v + 1);
    setSelectionError(undefined);
    setOverallProgress(null);
    setIsUploading(false);
  };

  // The Upload button.
  const handleSubmit = () => {
    // Nothing chosen: ask for a file instead of starting an upload.
    if (fileEntries.length === 0) {
      setSelectionError("Please select an image to upload.");
      return;
    }

    // The files that still need uploading (a row that already succeeded is skipped).
    const files = fileEntries
      .filter((e) => e.status !== "success")
      .map((e) => e.file);
    // Each of those files' position in the full list, so a batch result can be written back to the right row.
    // In practice this is 0, 1, 2, ... because the Upload button only shows while every row is idle.
    const originalIndices = fileEntries
      .map((e, i) => (e.status !== "success" ? i : -1))
      .filter((i) => i !== -1);

    // Exactly one file in the whole list: upload it directly and let the DIALOG show the progress screens
    // ("Uploading...", success, or the error screen) by passing the dialog's callback straight through.
    if (files.length === 1 && fileEntries.length === 1) {
      uploadImage({
        title: files[0].name.slice(0, files[0].name.lastIndexOf(".")),
        assetFile: files[0],
        progressCallback: onUploadProgress,
      });
      return;
    }

    // Several files: stay on this screen, show the counter, and start all the uploads at once (every row turns
    // to "uploading" immediately; the batch helper reports each row as its own upload finishes).
    setIsUploading(true);
    setOverallProgress({ current: 0, total: files.length });

    uploadImagesBatch({
      files,
      // Per-file status goes to that file's row.
      onFileStatusChange: (batchIndex, status, errorMessage) =>
        updateFileStatus(originalIndices[batchIndex], status, errorMessage),
      // Drives the "Uploading n / total..." line.
      onOverallProgress: (completed, total) =>
        setOverallProgress({ current: completed, total }),
      // Runs once, after the last file finished.
      onComplete: (allSucceeded, anySucceeded) => {
        setIsUploading(false);
        if (allSucceeded) {
          // Everything saved: the dialog shows its success screen.
          onUploadProgress({ status: UploaderStates.success });
        } else if (!anySucceeded) {
          // Nothing saved: the dialog shows its error screen. (Right for a first batch, which covers the whole list.)
          onUploadProgress({
            status: UploaderStates.assetError,
            errorMessage: "All uploads failed.",
          });
        }
        // Otherwise some saved and some failed: stay here with the per-row marks and the Retry Failed button.
        // The dialog is not told (see N-101 in BUGS.md).
      },
    });
  };

  // The Retry Failed button: upload again only the rows that are currently red.
  const retryAllFailed = () => {
    // Positions of the failed rows in the full list.
    const failedIndices = fileEntries
      .map((e, i) => (e.status === "error" ? i : -1))
      .filter((i) => i !== -1);
    // Nothing failed (a stale click): nothing to do.
    if (failedIndices.length === 0) return;

    // The failed rows' files, in list order.
    const failedFiles = failedIndices.map((i) => fileEntries[i].file);
    // Rows that were already saved before this retry started. `anySucceeded` below only describes the retried files,
    // so without this check a failed retry would report "All uploads failed." even though these rows are in the
    // library (and would swap the picker, with its Retry Failed button, for the error screen).
    const hadEarlierSuccess = fileEntries.some((e) => e.status === "success");

    // Same screen-state set-up as a first batch, but for the failed files only.
    setIsUploading(true);
    setOverallProgress({ current: 0, total: failedFiles.length });

    uploadImagesBatch({
      files: failedFiles,
      // Write each result back to the failed row it belongs to (batch position -> list position).
      onFileStatusChange: (batchIndex, status, errorMessage) =>
        updateFileStatus(failedIndices[batchIndex], status, errorMessage),
      onOverallProgress: (completed, total) =>
        setOverallProgress({ current: completed, total }),
      onComplete: (allSucceeded, anySucceeded) => {
        setIsUploading(false);
        if (allSucceeded) {
          // The retried files all saved. Because every earlier row was either saved or is in this batch, the
          // whole list is now saved, so the dialog shows its success screen.
          onUploadProgress({ status: UploaderStates.success });
        } else if (!anySucceeded && !hadEarlierSuccess) {
          // Nothing in the list was ever saved: the error screen is true.
          onUploadProgress({
            status: UploaderStates.assetError,
            errorMessage: "All uploads failed.",
          });
        }
      },
    });
  };

  // Facts about the list that decide what to draw below.
  // More than one file chosen: show the list-plus-preview layout instead of a single preview.
  const isMulti = fileEntries.length > 1;
  // At least one red row.
  const anyFailed = fileEntries.some((e) => e.status === "error");
  // At least one row is mid-upload (a batch row or a single-row Retry).
  const anyUploading = fileEntries.some((e) => e.status === "uploading");
  // Any row has left "idle": hides the Upload button so the same files cannot be submitted twice.
  const hasUploadStarted = fileEntries.some((e) => e.status !== "idle");
  // Every row has finished, one way or the other (used to show the failure summary and Retry Failed).
  const allDone =
    fileEntries.length > 0 &&
    fileEntries.every((e) => e.status === "success" || e.status === "error");

  return (
    <div className="flex flex-col gap-3">
      {/* The drop area / browse button. It is given the current files so it can show them, and it hands back the whole new selection. */}
      <FileUploader
        fileTypes={fileTypes}
        files={fileEntries.map((e) => e.file)}
        handleChange={handleFilesChange}
        multiple={true}
      />

      {/* "Please select an image to upload." after pressing Upload with an empty list. */}
      {selectionError && (
        <h6 className="z-10 text-red">{selectionError}</h6>
      )}

      {/* Nothing is drawn below the chooser until at least one file is picked. */}
      {fileEntries.length > 0 && (
        isMulti ? (
          // Several files: file list on the left, resizable against the preview on the right.
          <PanelGroup direction="horizontal">
            <Panel defaultSize={33} minSize={20}>
            {/* The file list. Clicking a row previews that file. */}
            <ul className="flex h-full flex-col gap-1 overflow-y-auto rounded-none border border-white/15 bg-black/30 p-2">
              {fileEntries.map((entry, i) => (
                <li
                  // Index keys are fine here: rows are only removed before the upload starts, and the status is kept
                  // in `fileEntries`, not in the row component.
                  key={i}
                  // `group` lets the Retry button (below) appear when the mouse is over this row; the previewed row is highlighted.
                  className={`group flex items-center justify-between gap-1.5 rounded-[3px] px-2 py-1 cursor-pointer text-sm transition-colors ${
                    i === previewIndex ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                  onClick={() => setPreviewIndex(i)}
                >
                  {/* The file name without its extension; the full name is in the tooltip. */}
                  <span className="truncate flex-1" title={entry.file.name}>
                    {entry.file.name.slice(0, entry.file.name.lastIndexOf("."))}
                  </span>
                  {/* The status mark. Exactly one of the four cases below is drawn for each row. */}
                  <span className="shrink-0">
                    {/* Not started: a cross to take the file out of the list. stopPropagation keeps the click from also selecting the row. */}
                    {entry.status === "idle" && (
                      <button
                        className="opacity-40 hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(i);
                        }}
                        title="Remove"
                      >
                        <XIcon />
                      </button>
                    )}
                    {/* Uploading: a spinner. */}
                    {entry.status === "uploading" && (
                      <LoaderIcon

                        className="animate-spin opacity-60" />
                    )}
                    {/* Saved: a green tick (the specs find a saved row by this class). */}
                    {entry.status === "success" && (
                      <CheckIcon

                        className="text-green-400" />
                    )}
                    {/* Failed: a red alert mark plus a Retry arrow that only shows while the mouse is over the row. */}
                    {entry.status === "error" && (
                      <span className="flex items-center gap-1">
                        <CircleAlertIcon

                          className="text-red-400" />
                        <button
                          className="hidden group-hover:inline-flex items-center text-xs text-white/60 hover:text-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            retrySingleFile(i);
                          }}
                          title="Retry"
                        >
                          <RotateCwIcon />
                        </button>
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            </Panel>

            {/* The draggable divider between the list and the preview. */}
            <PanelResizeHandle className="flex w-4 items-center justify-center">
              <div
                className="h-8 w-1 rounded-none bg-white/20 transition-colors hover:bg-white/40"
                // The library listens for pointerdown on the page in the capture phase, so this does not stop a
                // resize from starting; it only keeps the event from reaching anything above the grip.
                onPointerDown={(e) => e.stopPropagation()}
              />
            </PanelResizeHandle>

            <Panel defaultSize={67} minSize={25}>
            {/* The preview column: the image, then previous / next arrows with a "2 / 5" position label. */}
            <div className="flex h-full flex-col gap-2">
              <div className="relative aspect-square w-full overflow-hidden rounded-none border border-white/15 bg-black/30 flex items-center justify-center">
                {previewUrl && (
                  <img
                    // New key per row so the browser swaps to the new image instead of stretching the old one.
                    key={previewIndex}
                    alt="Preview"
                    className="m-auto max-h-full max-w-full object-contain"
                    src={previewUrl}
                  />
                )}
              </div>
              <div className="flex items-center justify-center gap-3">
                {/* Previous image (disabled on the first). */}
                <Button
                  variant="secondary"
                  onClick={() => setPreviewIndex((p) => Math.max(0, p - 1))}
                  disabled={previewIndex === 0}
                >
                  <ChevronLeftIcon />
                </Button>
                {/* Position label, counting from 1 for people. */}
                <span className="text-sm opacity-60">
                  {previewIndex + 1} / {fileEntries.length}
                </span>
                {/* Next image (disabled on the last). */}
                <Button
                  variant="secondary"
                  onClick={() =>
                    setPreviewIndex((p) =>
                      Math.min(fileEntries.length - 1, p + 1)
                    )
                  }
                  disabled={previewIndex === fileEntries.length - 1}
                >
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
            </Panel>
          </PanelGroup>
        ) : (
          // One file: just the preview, no list.
          previewUrl && (
            <div className="relative m-auto flex aspect-square w-full items-center justify-center overflow-hidden rounded-none border border-white/15 bg-black/30">
              <img
                alt="Preview"
                className="m-auto max-h-full max-w-full object-contain"
                src={previewUrl}
              />
            </div>
          )
        )
      )}

      {/* The counter shown while a multi-file upload runs. */}
      {(isUploading || anyUploading) && overallProgress && isMulti && (
        <p className="text-center text-sm opacity-60">
          Uploading {overallProgress.current} / {overallProgress.total}...
        </p>
      )}

      {/* After the batch ends with at least one red row: how many failed. */}
      {!isUploading && !anyUploading && allDone && anyFailed && isMulti && (
        <p className="text-center text-sm text-red-400">
          {fileEntries.filter((e) => e.status === "error").length} file(s) failed to upload.
        </p>
      )}

      {/* The button row. */}
      <div className="flex justify-end gap-2">
        {/* Always shown: closes the dialog. It does not stop an upload that is already running; the batch helper has no way to cancel. */}
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        {/* Only once every row has finished and some failed (the same condition as the failure summary above). */}
        {!isUploading && !anyUploading && allDone && anyFailed && isMulti && (
          <Button variant="secondary" onClick={retryAllFailed}>
            Retry Failed
          </Button>
        )}
        {/* Only before anything has started, so one list cannot be submitted twice; disabled with an empty list. */}
        {!hasUploadStarted && (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={fileEntries.length === 0}
          >
            Upload
          </Button>
        )}
      </div>
    </div>
  );
};
