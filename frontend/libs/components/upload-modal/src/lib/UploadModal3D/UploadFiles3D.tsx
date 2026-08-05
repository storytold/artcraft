import { useCallback, useEffect, useRef, useState } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { ListDropdown } from "@storyteller/ui-list-dropdown";
import { Select } from "@storyteller/ui-select";
import { Button } from "@storyteller/ui-button";
import { FileUploader } from "@storyteller/ui-file-uploader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCube,
  faXmark,
  faCheck,
  faCircleExclamation,
  faChevronLeft,
  faChevronRight,
  faRotateRight,
  faSpinner,
} from "@fortawesome/pro-solid-svg-icons";
import * as THREE from "three";
import {
  convertFbxToGlb,
  loadPreviewOnCanvas,
  readGlbAnimationDurationMillis,
  snapshotCanvasAsThumbnail,
} from "./utilities";
import { upload3DObjects } from "./utilities/upload3DObjects";
import { upload3DObjectsBatch } from "./utilities/upload3DObjectsBatch";
import {
  FileEntryStatus,
  FilterEngineCategories,
  MediaFileAnimationType,
  UploaderState,
  UploaderStates,
} from "../Types";

interface FileEntry {
  file: File;
  status: FileEntryStatus;
  errorMessage?: string;
}

interface Props {
  title: string;
  fileTypes: string[];
  engineCategory: FilterEngineCategories;
  initialFiles?: File[];
  options?: {
    fileSubtypes?: { [key: string]: string }[];
    hasLength?: boolean;
    hasThumbnailUpload?: boolean;
  };
  onClose: () => void;
  onUploadProgress: (newState: UploaderState) => void;
  // Fired when a previewed model turns out to be a mesh-less skeleton
  // (animation-only export) — the modal preselects "Upload as Animation".
  onMeshlessDetected?: () => void;
}

export const UploadFiles3D = ({
  fileTypes,
  engineCategory,
  initialFiles,
  options,
  onClose,
  onUploadProgress,
  onMeshlessDetected,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | undefined>(undefined);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const canvasCallbackRef = useCallback((node: HTMLCanvasElement | null) => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    if (node !== null) {
      canvasRef.current = node;
      const observer = new ResizeObserver(() => {
        const renderer = rendererRef.current;
        const camera = cameraRef.current;
        if (!renderer || !camera) return;
        const w = node.clientWidth;
        const h = node.clientHeight;
        if (w === 0 || h === 0) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      });
      observer.observe(node);
      resizeObserverRef.current = observer;
    }
  }, []);

  const fileSubtypes = options?.fileSubtypes;

  const [subtype, setSubtype] = useState<MediaFileAnimationType | undefined>(
    fileSubtypes
      ? (Object.values(fileSubtypes[0])[0] as MediaFileAnimationType)
      : undefined,
  );

  const seedFiles = initialFiles ?? [];

  // FBX files are accepted at the picker but normalized to GLB in the
  // browser (convertFbxToGlb) before they can be previewed or uploaded —
  // they enter as "converting" and swap to the converted GLB when done.
  const isFbx = (file: File) => file.name.toLowerCase().endsWith(".fbx");

  const [fileEntries, setFileEntries] = useState<FileEntry[]>(
    seedFiles.map((f) => ({
      file: f,
      status: isFbx(f) ? "converting" : "idle",
    })),
  );
  const [previewIndex, setPreviewIndex] = useState(0);
  // Incremented on every handleFilesChange so useEffect re-runs even when count stays the same
  const [filesVersion, setFilesVersion] = useState(0);
  const [previewStatus, setPreviewStatus] = useState<{
    type: string;
    message?: string;
  }>({ type: "init" });
  const [thumbnails, setThumbnails] = useState<Map<File, Blob>>(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [selectionError, setSelectionError] = useState<string | undefined>();

  // Baked-animation preview: clip names reported by the loader (empty for
  // still models — the picker only renders when there are clips), the
  // selected clip (-1 = none/T-pose; the first clip autoplays), and the
  // loader's switch function for the current preview.
  const [previewAnimations, setPreviewAnimations] = useState<string[]>([]);
  const [previewClip, setPreviewClip] = useState(0);
  const selectAnimationRef = useRef<((index: number) => void) | null>(null);

  const handlePreviewClipChange = (value: string | number) => {
    const index = Number(value);
    setPreviewClip(index);
    selectAnimationRef.current?.(index);
  };

  const disposeRenderer = () => {
    if (rendererRef.current) {
      rendererRef.current.setAnimationLoop(null);
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
  };

  // Normalize an FBX to GLB in the background. Completion swaps the entry's
  // File by identity, so it's naturally a no-op if the user re-picked or
  // removed the file mid-conversion.
  const beginFbxConversion = (original: File) => {
    convertFbxToGlb(original)
      .then((converted) => {
        setFileEntries((prev) =>
          prev.map((entry) =>
            entry.file === original
              ? { file: converted, status: "idle" as FileEntryStatus }
              : entry,
          ),
        );
        // Re-run the preview effect so the swapped-in GLB renders.
        setFilesVersion((v) => v + 1);
      })
      .catch((error) => {
        setFileEntries((prev) =>
          prev.map((entry) =>
            entry.file === original
              ? {
                  ...entry,
                  status: "error" as FileEntryStatus,
                  errorMessage: `FBX conversion failed: ${String(error)}`,
                }
              : entry,
          ),
        );
      });
  };

  // Kick off conversions for any FBX files seeded via initialFiles.
  useEffect(() => {
    seedFiles.filter(isFbx).forEach(beginFbxConversion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const currentEntry = fileEntries[previewIndex];
    const currentFile = currentEntry?.file;
    if (!canvasRef.current || !currentFile) return;
    // Nothing to preview until an FBX has been converted (the loader can't
    // parse FBX; a failed conversion also stays un-previewed).
    if (currentEntry.status === "converting" || isFbx(currentFile)) {
      disposeRenderer();
      setPreviewStatus({ type: "init" });
      return;
    }

    disposeRenderer();
    setPreviewStatus({ type: "init" });
    setPreviewAnimations([]);
    setPreviewClip(0);
    selectAnimationRef.current = null;

    const { renderer, camera, selectAnimation } = loadPreviewOnCanvas({
      file: currentFile,
      canvas: canvasRef.current,
      statusCallback: setPreviewStatus,
      onAnimationsAvailable: setPreviewAnimations,
      onModelInfo: (info) => {
        if (!info.hasMesh) onMeshlessDetected?.();
      },
    });
    rendererRef.current = renderer;
    cameraRef.current = camera;
    selectAnimationRef.current = selectAnimation;

    return disposeRenderer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewIndex, filesVersion]);

  useEffect(() => {
    if (previewStatus.type === "OK" && canvasRef.current) {
      snapshotCanvasAsThumbnail({
        targetNode: canvasRef.current,
        resultCallback: (blob) => {
          const currentFile = fileEntries[previewIndex]?.file;
          if (blob && currentFile) {
            setThumbnails((prev) => new Map(prev).set(currentFile, blob));
          }
        },
      });
    }
  }, [previewStatus, previewIndex]);

  useEffect(() => {
    if (!fileSubtypes || fileSubtypes.length === 0) {
      setSubtype(undefined);
      return;
    }
    setSubtype(
      Object.values(fileSubtypes[0])[0] as MediaFileAnimationType | undefined,
    );
  }, [fileSubtypes]);

  const updateFileStatus = (
    index: number,
    status: FileEntryStatus,
    errorMessage?: string,
  ) => {
    setFileEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, status, errorMessage } : entry,
      ),
    );
  };

  const removeFile = (index: number) => {
    setFileEntries((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setPreviewIndex((prevIdx) =>
        Math.min(prevIdx, Math.max(0, next.length - 1)),
      );
      return next;
    });
    setFilesVersion((v) => v + 1);
  };

  // Resolve the backend-required clip durations for an animation upload.
  // Files with no clips are marked as errors (the backend would reject them)
  // and excluded from the returned map.
  const resolveAnimationDurations = async (
    files: File[],
  ): Promise<Map<File, number>> => {
    const durations = new Map<File, number>();
    await Promise.all(
      files.map(async (file) => {
        const millis = await readGlbAnimationDurationMillis(file).catch(
          () => null,
        );
        if (millis === null) {
          setFileEntries((prev) =>
            prev.map((entry) =>
              entry.file === file
                ? {
                    ...entry,
                    status: "error" as FileEntryStatus,
                    errorMessage: "No animation clips found in this file.",
                  }
                : entry,
            ),
          );
        } else {
          durations.set(file, millis);
        }
      }),
    );
    return durations;
  };

  const isAnimationUpload =
    engineCategory === FilterEngineCategories.ANIMATION;

  const retrySingleFile = async (index: number) => {
    const entry = fileEntries[index];
    if (!entry || entry.status === "uploading" || entry.status === "converting")
      return;
    // A failed FBX conversion retries the conversion, not an upload — the
    // raw FBX must never reach the backend.
    if (isFbx(entry.file)) {
      updateFileStatus(index, "converting");
      beginFbxConversion(entry.file);
      return;
    }
    let durationMillis: number | undefined;
    if (isAnimationUpload) {
      const millis = await readGlbAnimationDurationMillis(entry.file).catch(
        () => null,
      );
      if (millis === null) {
        updateFileStatus(index, "error", "No animation clips found in this file.");
        return;
      }
      durationMillis = millis;
    }
    updateFileStatus(index, "uploading");
    await upload3DObjects({
      title: entry.file.name.slice(0, entry.file.name.lastIndexOf(".")),
      assetFile: entry.file,
      engineCategory,
      animationType: subtype,
      durationMillis,
      thumbnailSnapshot: thumbnails.get(entry.file),
      progressCallback: (state) => {
        if (state.status === UploaderStates.success) {
          updateFileStatus(index, "success");
        } else if (
          state.status === UploaderStates.assetError ||
          state.status === UploaderStates.coverCreateError ||
          state.status === UploaderStates.coverSetError
        ) {
          updateFileStatus(index, "error", state.errorMessage);
        }
      },
    });
  };

  const handleFilesChange = (files: File[]) => {
    setFileEntries(
      files.map((f) => ({
        file: f,
        status: isFbx(f) ? "converting" : "idle",
      })),
    );
    setPreviewIndex(0);
    setFilesVersion((v) => v + 1);
    setThumbnails(new Map());
    setSelectionError(undefined);
    setOverallProgress(null);
    setIsUploading(false);
    files.filter(isFbx).forEach(beginFbxConversion);
  };

  const handleSubmit = async () => {
    if (fileEntries.length === 0) {
      setSelectionError("Please select a file to upload.");
      return;
    }
    if (fileEntries.some((e) => e.status === "converting")) {
      setSelectionError("Still converting FBX files — one moment.");
      return;
    }

    const pendingEntries = fileEntries
      .map((e, i) => ({ entry: e, originalIndex: i }))
      .filter(
        // Un-converted FBX entries (conversion failed) are excluded — the
        // raw FBX must never be uploaded.
        ({ entry }) =>
          entry.status !== "success" &&
          entry.file !== undefined &&
          !isFbx(entry.file),
      );
    let files = pendingEntries.map(({ entry }) => entry.file!);
    let originalIndices = pendingEntries.map(
      ({ originalIndex }) => originalIndex,
    );

    // Animation uploads must carry the clip duration; clip-less files are
    // flagged and dropped from the submission.
    let durations: Map<File, number> | undefined;
    if (isAnimationUpload) {
      durations = await resolveAnimationDurations(files);
      const keep = files.map((file) => durations!.has(file));
      files = files.filter((_, i) => keep[i]);
      originalIndices = originalIndices.filter((_, i) => keep[i]);
      if (files.length === 0) {
        setSelectionError("No animation clips found in the selected file(s).");
        return;
      }
    }

    const pendingThumbnails = new Map<File, Blob>(
      files
        .map((file) => [file, thumbnails.get(file) ?? undefined])
        .filter((pair): pair is [File, Blob] => pair[1] !== undefined),
    );

    if (files.length === 1 && fileEntries.length === 1) {
      upload3DObjects({
        title: files[0].name.slice(0, files[0].name.lastIndexOf(".")),
        assetFile: files[0],
        engineCategory,
        animationType: subtype,
        durationMillis: durations?.get(files[0]),
        thumbnailSnapshot: thumbnails.get(files[0]),
        progressCallback: onUploadProgress,
      });
      return;
    }

    setIsUploading(true);
    setOverallProgress({ current: 0, total: files.length });

    upload3DObjectsBatch({
      files,
      thumbnails: pendingThumbnails,
      engineCategory,
      animationType: subtype,
      durationsMillis: durations,
      onFileStatusChange: (batchIndex, status, errorMessage) =>
        updateFileStatus(originalIndices[batchIndex], status, errorMessage),
      onOverallProgress: (completed, total) =>
        setOverallProgress({ current: completed, total }),
      onComplete: (allSucceeded, anySucceeded) => {
        setIsUploading(false);
        if (allSucceeded) {
          onUploadProgress({ status: UploaderStates.success });
        } else if (!anySucceeded) {
          onUploadProgress({
            status: UploaderStates.assetError,
            errorMessage: "All uploads failed.",
          });
        }
      },
    });
  };

  const retryAllFailed = async () => {
    // FBX conversion failures are excluded (they retry per-row as a
    // re-conversion); this batch path only re-uploads real GLBs.
    let failedIndices = fileEntries
      .map((e, i) => (e.status === "error" && !isFbx(e.file) ? i : -1))
      .filter((i) => i !== -1);
    if (failedIndices.length === 0) return;

    let failedFiles = failedIndices
      .map((i) => fileEntries[i].file!)
      .filter((file) => file !== undefined);

    let durations: Map<File, number> | undefined;
    if (isAnimationUpload) {
      durations = await resolveAnimationDurations(failedFiles);
      const keep = failedFiles.map((file) => durations!.has(file));
      failedFiles = failedFiles.filter((_, i) => keep[i]);
      failedIndices = failedIndices.filter((_, i) => keep[i]);
      if (failedFiles.length === 0) return;
    }

    const failedThumbnails = new Map<File, Blob>(
      failedFiles
        .map((file): [File, Blob | undefined] => [
          file,
          thumbnails.get(file) ?? undefined,
        ])
        .filter((pair): pair is [File, Blob] => pair[1] !== undefined),
    );

    setIsUploading(true);
    setOverallProgress({ current: 0, total: failedFiles.length });

    upload3DObjectsBatch({
      files: failedFiles,
      thumbnails: failedThumbnails,
      engineCategory,
      animationType: subtype,
      durationsMillis: durations,
      onFileStatusChange: (batchIndex, status, errorMessage) =>
        updateFileStatus(failedIndices[batchIndex], status, errorMessage),
      onOverallProgress: (completed, total) =>
        setOverallProgress({ current: completed, total }),
      onComplete: (allSucceeded, anySucceeded) => {
        setIsUploading(false);
        if (allSucceeded) {
          onUploadProgress({ status: UploaderStates.success });
        } else if (!anySucceeded) {
          onUploadProgress({
            status: UploaderStates.assetError,
            errorMessage: "All uploads failed.",
          });
        }
      },
    });
  };

  // Overlayed on the preview canvas when the current model has baked clips;
  // still models get no extra chrome. Shared by the single and multi layouts.
  const animationPicker = previewAnimations.length > 0 && (
    <div className="pointer-events-auto absolute right-2 top-2 z-10 w-44">
      <Select
        value={String(previewClip)}
        onChange={handlePreviewClipChange}
        options={[
          ...previewAnimations.map((name, index) => ({
            label: name,
            value: String(index),
          })),
          { label: "T-pose (none)", value: "-1" },
        ]}
      />
    </div>
  );

  const isMulti = fileEntries.length > 1;
  const anyFailed = fileEntries.some((e) => e.status === "error");
  const anyUploading = fileEntries.some((e) => e.status === "uploading");
  const anyConverting = fileEntries.some((e) => e.status === "converting");
  // "Started" means an actual upload — FBX conversion (and its failures)
  // must not hide the Upload button.
  const hasUploadStarted = fileEntries.some(
    (e) => e.status === "uploading" || e.status === "success",
  );
  const allDone =
    fileEntries.length > 0 &&
    fileEntries.every((e) => e.status === "success" || e.status === "error");
  const currentFile = fileEntries[previewIndex]?.file;
  const isConvertingCurrent =
    fileEntries[previewIndex]?.status === "converting";

  // Overlayed on the preview canvas while the current FBX is normalizing,
  // or when its conversion failed (the sidebar only exists in multi mode).
  const currentEntry = fileEntries[previewIndex];
  const convertingOverlay = isConvertingCurrent ? (
    <h6 className="pointer-events-none absolute left-0 top-1/2 -mt-5 flex w-full items-center justify-center gap-2.5 text-center opacity-60">
      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
      Converting FBX to GLB...
    </h6>
  ) : currentEntry?.status === "error" && isFbx(currentEntry.file) ? (
    <h6 className="pointer-events-none absolute left-0 top-1/2 -mt-5 w-full px-4 text-center text-red-400">
      {currentEntry.errorMessage ?? "FBX conversion failed."}
    </h6>
  ) : null;

  return (
    <div className="flex flex-col gap-3">
      {fileSubtypes && fileSubtypes.length > 1 && (
        <ListDropdown
          list={fileSubtypes}
          onSelect={(value) => setSubtype(value as MediaFileAnimationType)}
        />
      )}

      <FileUploader
        fileTypes={fileTypes}
        files={fileEntries.map((e) => e.file)}
        handleChange={handleFilesChange}
        multiple={true}
        fileIcon={faCube}
      />

      {selectionError && <h6 className="z-10 text-red">{selectionError}</h6>}

      {isMulti ? (
        <PanelGroup direction="horizontal">
          <Panel defaultSize={33} minSize={20}>
          <ul className="flex h-full flex-col gap-1 overflow-y-auto rounded-lg bg-brand-secondary p-2">
            {fileEntries.map((entry, i) => (
              <li
                key={i}
                className={`group flex cursor-pointer items-center justify-between gap-1.5 rounded px-2 py-1 text-sm transition-colors ${
                  i === previewIndex ? "bg-white/10" : "hover:bg-white/5"
                }`}
                onClick={() => setPreviewIndex(i)}
              >
                <span className="flex-1 truncate" title={entry.file.name}>
                  {entry.file.name.slice(0, entry.file.name.lastIndexOf("."))}
                </span>
                <span className="shrink-0">
                  {entry.status === "idle" && (
                    <button
                      className="opacity-40 transition-opacity hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      title="Remove"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  )}
                  {(entry.status === "uploading" ||
                    entry.status === "converting") && (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin opacity-60"
                    />
                  )}
                  {entry.status === "success" && (
                    <FontAwesomeIcon
                      icon={faCheck}
                      className="text-green-400"
                    />
                  )}
                  {entry.status === "error" && (
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon
                        icon={faCircleExclamation}
                        className="text-red-400"
                      />
                      <button
                        className="hidden items-center text-xs text-white/60 transition-colors hover:text-white group-hover:inline-flex"
                        onClick={(e) => {
                          e.stopPropagation();
                          retrySingleFile(i);
                        }}
                        title="Retry"
                      >
                        <FontAwesomeIcon icon={faRotateRight} />
                      </button>
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          </Panel>

          <PanelResizeHandle className="flex w-4 items-center justify-center">
            <div
              className="h-8 w-1 rounded-full bg-white/20 transition-colors hover:bg-white/40"
              onPointerDown={(e) => e.stopPropagation()}
            />
          </PanelResizeHandle>

          <Panel defaultSize={67} minSize={25}>
          <div className="flex h-full flex-col gap-2">
            <div className="relative w-full min-h-48 overflow-hidden rounded-lg bg-brand-secondary">
              <canvas
                className="pointer-events-none h-full min-h-48 !w-full"
                ref={canvasCallbackRef}
              />
              {animationPicker}
              {convertingOverlay}
              {!currentFile && (
                <h6 className="pointer-events-auto absolute left-0 top-1/2 -mt-5 flex w-full items-center justify-center gap-2.5 text-center opacity-50">
                  <FontAwesomeIcon icon={faCube} />
                  Your model preview will appear here
                </h6>
              )}
              {previewStatus.type.includes("Error") && (
                <h6 className="pointer-events-auto absolute left-0 top-1/2 -mt-5 w-full text-center">
                  {previewStatus.type}
                  {previewStatus.message && <br />}
                  {previewStatus.message}
                </h6>
              )}
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                onClick={() => setPreviewIndex((p) => Math.max(0, p - 1))}
                disabled={previewIndex === 0}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </Button>
              <span className="text-sm opacity-60">
                {previewIndex + 1} / {fileEntries.length}
              </span>
              <Button
                variant="secondary"
                onClick={() =>
                  setPreviewIndex((p) =>
                    Math.min(fileEntries.length - 1, p + 1),
                  )
                }
                disabled={previewIndex === fileEntries.length - 1}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </Button>
            </div>
          </div>
          </Panel>
        </PanelGroup>
      ) : (
        <div className="relative m-auto w-full min-h-48 overflow-hidden rounded-lg bg-brand-secondary">
          <canvas
            className="pointer-events-none h-full min-h-48 !w-full"
            ref={canvasCallbackRef}
          />
          {animationPicker}
          {convertingOverlay}
          {!currentFile && (
            <h6 className="pointer-events-auto absolute left-0 top-1/2 -mt-5 flex w-full items-center justify-center gap-2.5 text-center opacity-50">
              <FontAwesomeIcon icon={faCube} />
              Your model preview will appear here
            </h6>
          )}
          {previewStatus.type.includes("Error") && (
            <h6 className="pointer-events-auto absolute left-0 top-1/2 -mt-5 w-full text-center">
              {previewStatus.type}
              {previewStatus.message && <br />}
              {previewStatus.message}
            </h6>
          )}
        </div>
      )}

      {(isUploading || anyUploading) && overallProgress && isMulti && (
        <p className="text-center text-sm opacity-60">
          Uploading {overallProgress.current} / {overallProgress.total}...
        </p>
      )}

      {!isUploading && !anyUploading && allDone && anyFailed && isMulti && (
        <p className="text-center text-sm text-red-400">
          {fileEntries.filter((e) => e.status === "error").length} file(s)
          failed to upload.
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        {!isUploading && !anyUploading && allDone && anyFailed && isMulti && (
          <Button variant="secondary" onClick={retryAllFailed}>
            Retry Failed
          </Button>
        )}
        {!hasUploadStarted && (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={fileEntries.length === 0 || anyConverting}
          >
            {anyConverting ? "Converting..." : "Upload"}
          </Button>
        )}
      </div>
    </div>
  );
};
