import { useCallback, useEffect, useState, useRef } from "react";
import { ListDropdown } from "@storyteller/ui-list-dropdown";
import { Button } from "@storyteller/ui-button";
import { FileUploader } from "@storyteller/ui-file-uploader";
import { loadPreviewOnCanvas, snapshotCanvasAsThumbnail } from "./utilities";
import { upload3DObjects } from "./utilities/upload3DObjects";
import { UploaderState } from "../../../models";
import { FilterEngineCategories, MediaFileAnimationType } from "../../../enums";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCube } from "@fortawesome/pro-solid-svg-icons";

interface Props {
  title: string;
  fileTypes: string[];
  engineCategory: FilterEngineCategories;
  options?: {
    fileSubtypes?: { [key: string]: string }[];
    hasLength?: boolean;
    hasThumbnailUpload?: boolean;
  };
  onClose: () => void;
  onUploadProgress: (newState: UploaderState) => void;
}

export const UploadFiles3D = ({
  fileTypes,
  engineCategory,
  options,
  onClose,
  onUploadProgress,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | undefined>(undefined);
  const canvasCallbackRef = useCallback((node: HTMLCanvasElement) => {
    if (node !== null) {
      canvasRef.current = node;
    }
  }, []);

  const fileSubtypes = options?.fileSubtypes;
  // const hasLength = options?.hasLength;
  // const hasThumbnailUpload = options?.hasThumbnailUpload;

  const [subtype, setSubtype] = useState<MediaFileAnimationType | undefined>(
    fileSubtypes
      ? (Object.values(fileSubtypes[0])[0] as MediaFileAnimationType)
      : undefined,
  );

  const [assetFile, setAssetFile] = useState<{
    value: File | null;
    error?: string;
  }>({ value: null });

  const [previewStatus, setPreviewStatus] = useState<{
    type: string;
    message?: string;
  }>({ type: "init" });

  const [thumbnailFile, setThumbnailFile] = useState<Blob | undefined>(
    undefined,
  );

  const handleSubmit = () => {
    if (!assetFile.value) {
      setAssetFile((curr) => ({
        ...curr,
        error: "Please select a file to upload.",
      }));
      return;
    }

    // Use the filename as the title
    const title = assetFile.value.name.split(".")[0];

    upload3DObjects({
      title: title,
      assetFile: assetFile.value,
      thumbnailSnapshot: thumbnailFile,
      engineCategory: engineCategory,
      animationType: subtype,
      progressCallback: onUploadProgress,
    });
  };

  useEffect(() => {
    // Reset subtype when fileSubtypes set changes (e.g., toggling character)
    if (!fileSubtypes || fileSubtypes.length === 0) {
      setSubtype(undefined);
      return;
    }
    const nextDefault = Object.values(fileSubtypes[0])[0] as
      | MediaFileAnimationType
      | undefined;
    setSubtype(nextDefault);
  }, [fileSubtypes]);

  useEffect(() => {
    if (canvasRef.current && assetFile.value) {
      loadPreviewOnCanvas({
        file: assetFile.value,
        canvas: canvasRef.current,
        statusCallback: (statusObject: { type: string; message?: string }) => {
          setPreviewStatus(statusObject);
        },
      });
    }
  }, [assetFile.value]);

  useEffect(() => {
    if (previewStatus.type === "OK" && canvasRef.current) {
      snapshotCanvasAsThumbnail({
        targetNode: canvasRef.current!,
        resultCallback: (snapshotBlob) => {
          if (snapshotBlob) {
            setThumbnailFile(snapshotBlob);
          }
        },
      });
    }
  }, [previewStatus]);

  return (
    <>
      <div className="flex flex-col gap-3">
        <FileUploader
          fileTypes={fileTypes}
          file={assetFile.value ?? undefined}
          handleChange={(file: File) => {
            setAssetFile({
              value: file,
            });
          }}
        />
        {fileSubtypes && fileSubtypes.length > 1 && (
          <ListDropdown
            list={fileSubtypes}
            onSelect={(value) => setSubtype(value as MediaFileAnimationType)}
          />
        )}
        {assetFile.error && (
          <h6 className="z-10 text-red">{assetFile.error}</h6>
        )}

        <div className="relative m-auto w-full overflow-hidden rounded-lg bg-brand-secondary">
          <canvas
            className="pointer-events-none h-full w-full"
            ref={canvasCallbackRef}
          />
          {!assetFile.value && (
            <h6 className="pointer-events-auto absolute left-0 top-1/2 -mt-5 flex w-full items-center justify-center gap-2.5 text-center opacity-50">
              <FontAwesomeIcon icon={faCube} />
              Your model preview will appear here
            </h6>
          )}
          {previewStatus.type.includes("Error") && (
            <>
              <h6 className="pointer-events-auto absolute left-0 top-1/2 -mt-5 w-full text-center">
                {previewStatus.type}
                {previewStatus.message && <br />}
                {previewStatus.message}
              </h6>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!assetFile.value}
          >
            Upload
          </Button>
        </div>
      </div>
    </>
  );
};
