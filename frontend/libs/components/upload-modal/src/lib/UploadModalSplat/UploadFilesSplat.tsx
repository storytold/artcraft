// The picker screen inside the "Upload splat" dialog (UploadModalSplat.tsx renders this while the dialog is in its
// `ready` state). It lets the person choose one or many splat files, shows a live 3D preview of the file they are
// looking at, takes a picture of that preview to use as the library cover, uploads the files, and reports the outcome
// to the dialog through `onUploadProgress`. A multi-file upload stays on this screen and shows per-row status.
import { useCallback, useEffect, useRef, useState } from "react";
// A resizable two-column layout (file list on the left, preview on the right) used only when several files are chosen.
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
// The drop-down used to pick one of several file subtypes (only drawn when there is more than one choice).
import { ListDropdown } from "@storyteller/ui-list-dropdown";
// The app's shared button component.
import { Button } from "@storyteller/ui-button";
// The shared drag-and-drop / click-to-browse file chooser (it wraps react-drag-drop-files).
import { FileUploader } from "@storyteller/ui-file-uploader";
// Small icons: the cube for "no model yet", row status marks (loader / check / alert), the Retry arrow, the Remove
// cross, and the preview arrows.
import { BoxIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, CircleAlertIcon, LoaderIcon, RotateCwIcon, XIcon } from "lucide-react";
// Types only: the three.js renderer and camera objects the preview loader hands back.
import { WebGLRenderer, PerspectiveCamera } from "three";
// `loadPreviewOnCanvas` starts drawing a file on a canvas and reports its status; `snapshotCanvasAsThumbnail` turns the
// canvas into an image Blob (both live next to the 3D dialog because the two dialogs share them).
import { loadPreviewOnCanvas, snapshotCanvasAsThumbnail } from "../UploadModal3D/utilities";
// Uploads ONE file through the API flow (asset, then cover image) and reports progress as an UploaderState.
import { upload3DObjects } from "../UploadModal3D/utilities/upload3DObjects";
// Uploads several files at the same time (Promise.all) and reports per-file status instead of an UploaderState.
import { upload3DObjectsBatch } from "../UploadModal3D/utilities/upload3DObjectsBatch";
// Shared types: the per-row status words, the engine category sent to the API, the animation subtype, the dialog's
// state object, and its numeric state enum.
import {
  FileEntryStatus,
  FilterEngineCategories,
  MediaFileAnimationType,
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
  // Extensions the file chooser accepts, such as ["spz", "ply"].
  fileTypes: string[];
  // The category the API files the upload under (it is sent with every upload call below).
  engineCategory: FilterEngineCategories;
  // Files to start with (for example files dropped on the app window before the dialog opened). Read on mount only.
  initialFiles?: File[];
  // Optional extras from the dialog. Only `fileSubtypes` is read here; `hasLength` and `hasThumbnailUpload` are part
  // of the shared options shape but this picker ignores them.
  options?: {
    fileSubtypes?: { [key: string]: string }[];
    hasLength?: boolean;
    hasThumbnailUpload?: boolean;
  };
  // Closes the dialog (the Cancel button).
  onClose: () => void;
  // Tells the dialog how the upload went. The dialog swaps screens on `success` and on the error states.
  onUploadProgress: (newState: UploaderState) => void;
}

export const UploadFilesSplat = ({
  fileTypes,
  engineCategory,
  initialFiles,
  options,
  onClose,
  onUploadProgress,
}: Props) => {
  // The <canvas> element the preview is drawn on. Written by `canvasCallbackRef`, read by the effects below.
  const canvasRef = useRef<HTMLCanvasElement | undefined>(undefined);
  // The three.js renderer and camera of the CURRENT preview (set after each load, cleared when it is disposed).
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  // The observer that keeps the renderer the same size as the canvas on screen.
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  // A "callback ref": React calls it with the canvas when it appears and with null when it goes away. The canvas is
  // drawn in two places below (single-file layout and multi-file layout), so it gets replaced when the layout changes.
  const canvasCallbackRef = useCallback((node: HTMLCanvasElement | null) => {
    // Stop watching the old canvas (if any) before doing anything else.
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    // A new canvas has appeared: remember it and start watching its size.
    if (node !== null) {
      canvasRef.current = node;
      const observer = new ResizeObserver(() => {
        // No preview running yet (or it was disposed): nothing to resize.
        const renderer = rendererRef.current;
        const camera = cameraRef.current;
        if (!renderer || !camera) return;
        // The canvas's size on screen, in CSS pixels. Zero means it is hidden; skip rather than make a 0x0 renderer.
        const w = node.clientWidth;
        const h = node.clientHeight;
        if (w === 0 || h === 0) return;
        // `false` = resize the drawing buffer only, leave the canvas's CSS size to the layout classes.
        renderer.setSize(w, h, false);
        // Keep the picture from stretching: match the camera's width/height ratio to the canvas.
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      });
      observer.observe(node);
      resizeObserverRef.current = observer;
    }
  }, []);

  // The list of subtype choices from the dialog (for example animation kinds), or undefined when there are none.
  const fileSubtypes = options?.fileSubtypes;

  // The chosen subtype, sent with every upload. Starts as the first choice's value (each choice is a one-entry object,
  // so `Object.values(choice)[0]` is its value), or undefined when there are no choices.
  const [subtype, setSubtype] = useState<MediaFileAnimationType | undefined>(
    fileSubtypes
      ? (Object.values(fileSubtypes[0])[0] as MediaFileAnimationType)
      : undefined
  );

  // `initialFiles` may be undefined; treat that as an empty list.
  const seedFiles = initialFiles ?? [];

  // The list of chosen files with their upload status. It is seeded from `initialFiles` on the first render only;
  // after that the file chooser (handleFilesChange) is the only thing that replaces the list.
  const [fileEntries, setFileEntries] = useState<FileEntry[]>(
    seedFiles.map((f) => ({ file: f, status: "idle" }))
  );
  // Which row is shown in the preview.
  const [previewIndex, setPreviewIndex] = useState(0);
  // Incremented whenever the list is replaced or a row is removed, so the preview effect re-runs even when the
  // row number stays the same (a different file now sits there).
  const [filesVersion, setFilesVersion] = useState(0);
  // What the preview loader last reported: "init" while loading, "OK" once the splat has been drawn, or a status whose
  // type contains "Error" (drawn on top of the canvas as a message).
  const [previewStatus, setPreviewStatus] = useState<{ type: string; message?: string }>({ type: "init" });
  // The cover pictures taken from the preview, keyed by the File object. A file only has one if it was previewed.
  const [thumbnails, setThumbnails] = useState<Map<File, Blob>>(new Map());
  // True while a batch (Upload or Retry Failed) is running. A single-row Retry does not set this; it only marks its row.
  const [isUploading, setIsUploading] = useState(false);
  // The "Uploading n / total..." counter, or null before the first batch.
  const [overallProgress, setOverallProgress] = useState<{ current: number; total: number } | null>(null);
  // The red message shown above the list when Upload is pressed with nothing chosen.
  const [selectionError, setSelectionError] = useState<string | undefined>();

  // Tears down the current preview: stops its loop, cancels in-flight
  // loads and frees its scene and renderer (see loadPreviewOnCanvas).
  const disposePreviewRef = useRef<(() => void) | null>(null);
  const disposeRenderer = () => {
    // Run the loader's own cleanup (if a preview is running) and forget it so it cannot run twice.
    disposePreviewRef.current?.();
    disposePreviewRef.current = null;
    // The renderer is gone with it; the resize observer must not touch it any more.
    rendererRef.current = null;
  };

  // Start (or restart) the preview whenever the previewed row changes or the list is replaced.
  useEffect(() => {
    // The file in the row being previewed.
    const currentFile = fileEntries[previewIndex]?.file;
    // No canvas on screen yet, or nothing to preview: leave things as they are.
    if (!canvasRef.current || !currentFile) return;

    // Throw away the previous preview first, and show "init" (loading) until the new one reports in.
    disposeRenderer();
    setPreviewStatus({ type: "init" });

    // Begin drawing the file on the canvas. The loader calls `setPreviewStatus` as it goes and returns the three.js
    // objects plus a `dispose` function that stops everything it started.
    const { renderer, camera, dispose } = loadPreviewOnCanvas({
      file: currentFile,
      canvas: canvasRef.current,
      statusCallback: setPreviewStatus,
    });
    rendererRef.current = renderer;
    disposePreviewRef.current = dispose;
    cameraRef.current = camera;

    // When the effect re-runs or the picker closes, stop the preview (this also frees its WebGL memory).
    return disposeRenderer;
    // `fileEntries` is left out of the list on purpose: status changes (uploading, success, error) must not restart
    // the preview. Replacing the list always bumps `filesVersion` instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewIndex, filesVersion]);

  // Defer one animation frame so the splat renderer has produced a visible frame
  // Take the cover picture once the preview says it is ready. For a splat file the loader reports "OK" only after
  // the splat library has drawn its first sorted frame (B-165); before that fix it reported "OK" as soon as the file
  // was decoded, and this snapshot was a blank canvas.
  useEffect(() => {
    if (previewStatus.type === "OK" && canvasRef.current) {
      const canvas = canvasRef.current;
      // The file this snapshot belongs to, captured now so a later row change cannot attach it to the wrong file.
      const currentFile = fileEntries[previewIndex]?.file;
      const rafId = requestAnimationFrame(() => {
        // Copy the canvas into an image Blob; the callback gets null if the browser could not make one.
        snapshotCanvasAsThumbnail({
          targetNode: canvas,
          resultCallback: (blob) => {
            if (blob && currentFile) {
              // Functional update on a copy of the map, so overlapping snapshots never overwrite each other.
              setThumbnails((prev) => new Map(prev).set(currentFile, blob));
            }
          },
        });
      });
      // If the preview changes before the frame fires, drop the pending snapshot.
      return () => cancelAnimationFrame(rafId);
    }
    return undefined;
  }, [previewStatus, previewIndex]);

  // Keep the chosen subtype in step with the dialog's list: no choices means no subtype; a new list resets it to
  // the first choice.
  useEffect(() => {
    if (!fileSubtypes || fileSubtypes.length === 0) {
      setSubtype(undefined);
      return;
    }
    setSubtype(Object.values(fileSubtypes[0])[0] as MediaFileAnimationType | undefined);
  }, [fileSubtypes]);

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
    // Restart the preview even if the index number did not change (a different file now sits at that index).
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
    await upload3DObjects({
      // The library title is the file name without its extension.
      title: entry.file.name.slice(0, entry.file.name.lastIndexOf(".")),
      assetFile: entry.file,
      engineCategory,
      animationType: subtype,
      // The cover picture taken earlier for this file, if the person previewed it (otherwise undefined: no cover).
      thumbnailSnapshot: thumbnails.get(entry.file),
      progressCallback: (state) => {
        if (state.status === UploaderStates.success) {
          updateFileStatus(index, "success");
        } else if (
          // Any of the three failure states turns the row red: the file itself, or making / attaching its cover.
          state.status === UploaderStates.assetError ||
          state.status === UploaderStates.coverCreateError ||
          state.status === UploaderStates.coverSetError
        ) {
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
    // Start a fresh list: every row idle, preview back on the first row, old pictures, messages and counters cleared.
    setFileEntries(files.map((f) => ({ file: f, status: "idle" })));
    setPreviewIndex(0);
    setFilesVersion((v) => v + 1);
    setThumbnails(new Map());
    setSelectionError(undefined);
    setOverallProgress(null);
    setIsUploading(false);
  };

  // The Upload button.
  const handleSubmit = () => {
    // Nothing chosen: ask for a file instead of starting an upload.
    if (fileEntries.length === 0) {
      setSelectionError("Please select a file to upload.");
      return;
    }

    // The rows that still need uploading (a row that already succeeded is skipped), each remembered with its
    // position in the full list so a batch result can be written back to the right row.
    // In practice this is every row, because the Upload button only shows while every row is idle.
    const pendingEntries = fileEntries
      .map((e, i) => ({ entry: e, originalIndex: i }))
      .filter(({ entry }) => entry.status !== "success");
    // Just the files, in order.
    const files = pendingEntries.map(({ entry }) => entry.file);
    // Just the positions, in the same order.
    const originalIndices = pendingEntries.map(({ originalIndex }) => originalIndex);
    // The cover pictures for those files. A file the person never previewed has none and is left out of the map.
    const pendingThumbnails = new Map<File, Blob>(
      files
        .map((file): [File, Blob | undefined] => [file, thumbnails.get(file)])
        .filter((pair): pair is [File, Blob] => pair[1] !== undefined)
    );

    // Exactly one file in the whole list: upload it directly and let the DIALOG show the progress screens
    // ("Uploading...", success, or the error screen) by passing the dialog's callback straight through.
    if (files.length === 1 && fileEntries.length === 1) {
      upload3DObjects({
        title: files[0].name.slice(0, files[0].name.lastIndexOf(".")),
        assetFile: files[0],
        engineCategory,
        animationType: subtype,
        thumbnailSnapshot: thumbnails.get(files[0]),
        progressCallback: onUploadProgress,
      });
      return;
    }

    // Several files: stay on this screen, show the counter, and start all the uploads at once (every row turns
    // to "uploading" immediately; the batch helper reports each row as its own upload finishes).
    setIsUploading(true);
    setOverallProgress({ current: 0, total: files.length });

    upload3DObjectsBatch({
      files,
      thumbnails: pendingThumbnails,
      engineCategory,
      animationType: subtype,
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
    const failedFiles = failedIndices
      .map((i) => fileEntries[i].file)
      .filter((file) => file !== undefined);
    // Their cover pictures (only the ones that were taken).
    const failedThumbnails = new Map<File, Blob>(
      failedFiles
        .map((file): [File, Blob | undefined] => [file, thumbnails.get(file) ?? undefined])
        .filter((pair): pair is [File, Blob] => pair[1] !== undefined)
    );

    // Rows that were already saved before this retry started. `anySucceeded` below only describes the retried files,
    // so without this check a failed retry would report "All uploads failed." even though these rows are in the
    // library (and would swap the picker, with its Retry Failed button, for the error screen).
    const hadEarlierSuccess = fileEntries.some((e) => e.status === "success");

    // Same screen-state set-up as a first batch, but for the failed files only.
    setIsUploading(true);
    setOverallProgress({ current: 0, total: failedFiles.length });

    upload3DObjectsBatch({
      files: failedFiles,
      thumbnails: failedThumbnails,
      engineCategory,
      animationType: subtype,
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
  // The file in the previewed row (undefined when the list is empty); decides whether to show the "no model yet" hint.
  const currentFile = fileEntries[previewIndex]?.file;

  return (
    <div className="flex flex-col gap-3">
      {/* The subtype drop-down, only when the dialog offered more than one choice. */}
      {fileSubtypes && fileSubtypes.length > 1 && (
        <ListDropdown
          list={fileSubtypes}
          onSelect={(value) => setSubtype(value as MediaFileAnimationType)}
        />
      )}

      {/* The drop area / browse button. It is given the current files so it can show them, and it hands back the whole new selection. */}
      <FileUploader
        fileTypes={fileTypes}
        files={fileEntries.map((e) => e.file)}
        handleChange={handleFilesChange}
        multiple={true}
        fileIcon={BoxIcon}
      />

      {/* "Please select a file to upload." after pressing Upload with an empty list. */}
      {selectionError && (
        <h6 className="z-10 text-red">{selectionError}</h6>
      )}

      {isMulti ? (
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
                  {/* Saved: a green tick. */}
                  {entry.status === "success" && (
                    <CheckIcon  className="text-green-400" />
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
          {/* The preview column: the 3D canvas, then previous / next arrows with a "2 / 5" position label. */}
          <div className="flex h-full flex-col gap-2">
            <div className="relative w-full min-h-48 overflow-hidden rounded-none border border-white/15 bg-black/30">
              {/* The canvas the splat is drawn on. pointer-events-none so it cannot catch clicks meant for the dialog. */}
              <canvas
                className="pointer-events-none h-full min-h-48 !w-full"
                ref={canvasCallbackRef}
              />
              {/* A hint shown while there is no file to preview. */}
              {!currentFile && (
                <h6 className="pointer-events-auto absolute left-0 top-1/2 -mt-5 flex w-full items-center justify-center gap-2.5 text-center opacity-50">
                  <BoxIcon />
                  Your model preview will appear here
                </h6>
              )}
              {/* The loader's error text (for example "Error" plus a message) drawn over the canvas. */}
              {previewStatus.type.includes("Error") && (
                <h6 className="pointer-events-auto absolute left-0 top-1/2 -mt-5 w-full text-center">
                  {previewStatus.type}
                  {previewStatus.message && <br />}
                  {previewStatus.message}
                </h6>
              )}
            </div>
            <div className="flex items-center justify-center gap-3">
              {/* Previous file (disabled on the first). */}
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
              {/* Next file (disabled on the last). */}
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
        // One file (or none): just the preview, no list.
        <div className="relative m-auto w-full min-h-48 overflow-hidden rounded-none border border-white/15 bg-black/30">
          {/* The canvas the splat is drawn on (same ref callback as the multi-file layout). */}
          <canvas
            className="pointer-events-none h-full min-h-48 !w-full"
            ref={canvasCallbackRef}
          />
          {/* A hint shown while there is no file to preview. */}
          {!currentFile && (
            <h6 className="pointer-events-auto absolute left-0 top-1/2 -mt-5 flex w-full items-center justify-center gap-2.5 text-center opacity-50">
              <BoxIcon />
              Your model preview will appear here
            </h6>
          )}
          {/* The loader's error text drawn over the canvas. */}
          {previewStatus.type.includes("Error") && (
            <h6 className="pointer-events-auto absolute left-0 top-1/2 -mt-5 w-full text-center">
              {previewStatus.type}
              {previewStatus.message && <br />}
              {previewStatus.message}
            </h6>
          )}
        </div>
      )}

      {/* The "Uploading 2 / 5..." line, shown during a multi-file upload. */}
      {(isUploading || anyUploading) && overallProgress && isMulti && (
        <p className="text-center text-sm opacity-60">
          Uploading {overallProgress.current} / {overallProgress.total}...
        </p>
      )}

      {/* After a multi-file upload ends with some red rows: how many failed. */}
      {!isUploading && !anyUploading && allDone && anyFailed && isMulti && (
        <p className="text-center text-sm text-red-400">
          {fileEntries.filter((e) => e.status === "error").length} file(s) failed to upload.
        </p>
      )}

      {/* The button row. */}
      <div className="flex justify-end gap-2">
        {/* Cancel closes the dialog at any time. */}
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        {/* Retry Failed appears only when a multi-file upload has fully finished with at least one red row. */}
        {!isUploading && !anyUploading && allDone && anyFailed && isMulti && (
          <Button variant="secondary" onClick={retryAllFailed}>
            Retry Failed
          </Button>
        )}
        {/* Upload appears only before anything has started, and is disabled while the list is empty. */}
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
