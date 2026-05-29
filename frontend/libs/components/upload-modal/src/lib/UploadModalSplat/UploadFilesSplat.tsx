import { useCallback, useEffect, useRef, useState } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { ListDropdown } from "@storyteller/ui-list-dropdown";
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
import { WebGLRenderer, PerspectiveCamera } from "three";
import { loadPreviewOnCanvas, snapshotCanvasAsThumbnail } from "../UploadModal3D/utilities";
import { upload3DObjects } from "../UploadModal3D/utilities/upload3DObjects";
import { upload3DObjectsBatch } from "../UploadModal3D/utilities/upload3DObjectsBatch";
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
}

export const UploadFilesSplat = ({
  fileTypes,
  engineCategory,
  initialFiles,
  options,
  onClose,
  onUploadProgress,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | undefined>(undefined);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
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
      : undefined
  );

  const seedFiles = initialFiles ?? [];

  const [fileEntries, setFileEntries] = useState<FileEntry[]>(
    seedFiles.map((f) => ({ file: f, status: "idle" }))
  );
  const [previewIndex, setPreviewIndex] = useState(0);
  const [filesVersion, setFilesVersion] = useState(0);
  const [previewStatus, setPreviewStatus] = useState<{ type: string; message?: string }>({ type: "init" });
  const [thumbnails, setThumbnails] = useState<Map<File, Blob>>(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState<{ current: number; total: number } | null>(null);
  const [selectionError, setSelectionError] = useState<string | undefined>();

  const disposeRenderer = () => {
    if (rendererRef.current) {
      rendererRef.current.setAnimationLoop(null);
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
  };

  useEffect(() => {
    const currentFile = fileEntries[previewIndex]?.file;
    if (!canvasRef.current || !currentFile) return;

    disposeRenderer();
    setPreviewStatus({ type: "init" });

    const { renderer, camera } = loadPreviewOnCanvas({
      file: currentFile,
      canvas: canvasRef.current,
      statusCallback: setPreviewStatus,
    });
    rendererRef.current = renderer;
    cameraRef.current = camera;

    return disposeRenderer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewIndex, filesVersion]);

  // Defer one animation frame so the splat renderer has produced a visible frame
  useEffect(() => {
    if (previewStatus.type === "OK" && canvasRef.current) {
      const canvas = canvasRef.current;
      const currentFile = fileEntries[previewIndex]?.file;
      const rafId = requestAnimationFrame(() => {
        snapshotCanvasAsThumbnail({
          targetNode: canvas,
          resultCallback: (blob) => {
            if (blob && currentFile) {
              setThumbnails((prev) => new Map(prev).set(currentFile, blob));
            }
          },
        });
      });
      return () => cancelAnimationFrame(rafId);
    }
    return undefined;
  }, [previewStatus, previewIndex]);

  useEffect(() => {
    if (!fileSubtypes || fileSubtypes.length === 0) {
      setSubtype(undefined);
      return;
    }
    setSubtype(Object.values(fileSubtypes[0])[0] as MediaFileAnimationType | undefined);
  }, [fileSubtypes]);

  const updateFileStatus = (
    index: number,
    status: FileEntryStatus,
    errorMessage?: string
  ) => {
    setFileEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, status, errorMessage } : entry
      )
    );
  };

  const removeFile = (index: number) => {
    setFileEntries((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setPreviewIndex((prevIdx) => Math.min(prevIdx, Math.max(0, next.length - 1)));
      return next;
    });
    setFilesVersion((v) => v + 1);
  };

  const retrySingleFile = async (index: number) => {
    const entry = fileEntries[index];
    if (!entry || entry.status === "uploading") return;
    updateFileStatus(index, "uploading");
    await upload3DObjects({
      title: entry.file.name.slice(0, entry.file.name.lastIndexOf(".")),
      assetFile: entry.file,
      engineCategory,
      animationType: subtype,
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
    setFileEntries(files.map((f) => ({ file: f, status: "idle" })));
    setPreviewIndex(0);
    setFilesVersion((v) => v + 1);
    setThumbnails(new Map());
    setSelectionError(undefined);
    setOverallProgress(null);
    setIsUploading(false);
  };

  const handleSubmit = () => {
    if (fileEntries.length === 0) {
      setSelectionError("Please select a file to upload.");
      return;
    }

    const pendingEntries = fileEntries
      .map((e, i) => ({ entry: e, originalIndex: i }))
      .filter(({ entry }) => entry.status !== "success");
    const files = pendingEntries.map(({ entry }) => entry.file);
    const originalIndices = pendingEntries.map(({ originalIndex }) => originalIndex);
    const pendingThumbnails = new Map<File, Blob>(
      files
        .map((file): [File, Blob | undefined] => [file, thumbnails.get(file)])
        .filter((pair): pair is [File, Blob] => pair[1] !== undefined)
    );

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

    setIsUploading(true);
    setOverallProgress({ current: 0, total: files.length });

    upload3DObjectsBatch({
      files,
      thumbnails: pendingThumbnails,
      engineCategory,
      animationType: subtype,
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

  const retryAllFailed = () => {
    const failedIndices = fileEntries
      .map((e, i) => (e.status === "error" ? i : -1))
      .filter((i) => i !== -1);
    if (failedIndices.length === 0) return;

    const failedFiles = failedIndices
      .map((i) => fileEntries[i].file)
      .filter((file) => file !== undefined);
    const failedThumbnails = new Map<File, Blob>(
      failedFiles
        .map((file): [File, Blob | undefined] => [file, thumbnails.get(file) ?? undefined])
        .filter((pair): pair is [File, Blob] => pair[1] !== undefined)
    );

    setIsUploading(true);
    setOverallProgress({ current: 0, total: failedFiles.length });

    upload3DObjectsBatch({
      files: failedFiles,
      thumbnails: failedThumbnails,
      engineCategory,
      animationType: subtype,
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

  const isMulti = fileEntries.length > 1;
  const anyFailed = fileEntries.some((e) => e.status === "error");
  const anyUploading = fileEntries.some((e) => e.status === "uploading");
  const hasUploadStarted = fileEntries.some((e) => e.status !== "idle");
  const allDone =
    fileEntries.length > 0 &&
    fileEntries.every((e) => e.status === "success" || e.status === "error");
  const currentFile = fileEntries[previewIndex]?.file;

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

      {selectionError && (
        <h6 className="z-10 text-red">{selectionError}</h6>
      )}

      {isMulti ? (
        <PanelGroup orientation="horizontal">
          <Panel defaultSize="33%" minSize="20%">
          <ul className="flex h-full flex-col gap-1 overflow-y-auto rounded-lg bg-brand-secondary p-2">
            {fileEntries.map((entry, i) => (
              <li
                key={i}
                className={`group flex items-center justify-between gap-1.5 rounded px-2 py-1 cursor-pointer text-sm transition-colors ${
                  i === previewIndex ? "bg-white/10" : "hover:bg-white/5"
                }`}
                onClick={() => setPreviewIndex(i)}
              >
                <span className="truncate flex-1" title={entry.file.name}>
                  {entry.file.name.slice(0, entry.file.name.lastIndexOf("."))}
                </span>
                <span className="shrink-0">
                  {entry.status === "idle" && (
                    <button
                      className="opacity-40 hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      title="Remove"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  )}
                  {entry.status === "uploading" && (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin opacity-60"
                    />
                  )}
                  {entry.status === "success" && (
                    <FontAwesomeIcon icon={faCheck} className="text-green-400" />
                  )}
                  {entry.status === "error" && (
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon
                        icon={faCircleExclamation}
                        className="text-red-400"
                      />
                      <button
                        className="hidden group-hover:inline-flex items-center text-xs text-white/60 hover:text-white transition-colors"
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

          <PanelResizeHandle className="flex w-4 items-center justify-center" onPointerDown={(e) => e.stopPropagation()}>
            <div className="h-8 w-1 rounded-full bg-white/20 transition-colors hover:bg-white/40" />
          </PanelResizeHandle>

          <Panel defaultSize="67%" minSize="25%">
          <div className="flex h-full flex-col gap-2">
            <div className="relative w-full min-h-48 overflow-hidden rounded-lg bg-brand-secondary">
              <canvas
                className="pointer-events-none h-full min-h-48 !w-full"
                ref={canvasCallbackRef}
              />
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
                    Math.min(fileEntries.length - 1, p + 1)
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
          {fileEntries.filter((e) => e.status === "error").length} file(s) failed to upload.
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
            disabled={fileEntries.length === 0}
          >
            Upload
          </Button>
        )}
      </div>
    </div>
  );
};
