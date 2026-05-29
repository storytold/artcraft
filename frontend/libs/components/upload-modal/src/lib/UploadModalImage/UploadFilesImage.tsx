import { useEffect, useState } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Button } from "@storyteller/ui-button";
import { FileUploader } from "@storyteller/ui-file-uploader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faCheck,
  faCircleExclamation,
  faChevronLeft,
  faChevronRight,
  faRotateRight,
  faSpinner,
} from "@fortawesome/pro-solid-svg-icons";
import { uploadImage } from "./utilities/uploadImage";
import { uploadImagesBatch } from "./utilities/uploadImagesBatch";
import {
  FileEntryStatus,
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
  initialFiles?: File[];
  onClose: () => void;
  onUploadProgress: (newState: UploaderState) => void;
}

export const UploadFilesImage = ({
  fileTypes,
  initialFiles,
  onClose,
  onUploadProgress,
}: Props) => {
  const seedFiles = initialFiles ?? [];

  const [fileEntries, setFileEntries] = useState<FileEntry[]>(
    seedFiles.map((f) => ({ file: f, status: "idle" }))
  );
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Incremented on every handleFilesChange so useEffect re-runs even when count stays the same
  const [filesVersion, setFilesVersion] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState<{ current: number; total: number } | null>(null);
  const [selectionError, setSelectionError] = useState<string | undefined>();

  useEffect(() => {
    const currentFile = fileEntries[previewIndex]?.file;
    if (!currentFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(currentFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewIndex, filesVersion]);

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
    await uploadImage({
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

  const handleFilesChange = (files: File[]) => {
    setFileEntries(files.map((f) => ({ file: f, status: "idle" })));
    setPreviewIndex(0);
    setFilesVersion((v) => v + 1);
    setSelectionError(undefined);
    setOverallProgress(null);
    setIsUploading(false);
  };

  const handleSubmit = () => {
    if (fileEntries.length === 0) {
      setSelectionError("Please select an image to upload.");
      return;
    }

    const files = fileEntries
      .filter((e) => e.status !== "success")
      .map((e) => e.file);
    const originalIndices = fileEntries
      .map((e, i) => (e.status !== "success" ? i : -1))
      .filter((i) => i !== -1);

    if (files.length === 1 && fileEntries.length === 1) {
      uploadImage({
        title: files[0].name.slice(0, files[0].name.lastIndexOf(".")),
        assetFile: files[0],
        progressCallback: onUploadProgress,
      });
      return;
    }

    setIsUploading(true);
    setOverallProgress({ current: 0, total: files.length });

    uploadImagesBatch({
      files,
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

    const failedFiles = failedIndices.map((i) => fileEntries[i].file);

    setIsUploading(true);
    setOverallProgress({ current: 0, total: failedFiles.length });

    uploadImagesBatch({
      files: failedFiles,
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

  return (
    <div className="flex flex-col gap-3">
      <FileUploader
        fileTypes={fileTypes}
        files={fileEntries.map((e) => e.file)}
        handleChange={handleFilesChange}
        multiple={true}
      />

      {selectionError && (
        <h6 className="z-10 text-red">{selectionError}</h6>
      )}

      {fileEntries.length > 0 && (
        isMulti ? (
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
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-brand-secondary flex items-center justify-center">
                {previewUrl && (
                  <img
                    key={previewIndex}
                    alt="Preview"
                    className="m-auto max-h-full max-w-full object-contain"
                    src={previewUrl}
                  />
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
          previewUrl && (
            <div className="relative m-auto flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-brand-secondary">
              <img
                alt="Preview"
                className="m-auto max-h-full max-w-full object-contain"
                src={previewUrl}
              />
            </div>
          )
        )
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
