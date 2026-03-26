import { useCallback, useEffect, useState, useRef } from "react";
import { ListDropdown } from "@storyteller/ui-list-dropdown";
import { Button } from "@storyteller/ui-button";
import { FileUploader } from "@storyteller/ui-file-uploader";
import { UploaderState } from "../../../models";
import { FilterEngineCategories, MediaFileAnimationType, UploaderStates } from "../../../enums";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCube } from "@fortawesome/pro-solid-svg-icons";
import { loadPreviewOnCanvas, snapshotCanvasAsThumbnail } from "../UploadModal3D/utilities";
import { WebGLRenderer } from "three";
import { upload3DObjects } from "../UploadModal3D/utilities/upload3DObjects";

interface Props {
  title: string;
  fileTypes: string[];
  engineCategory: FilterEngineCategories;
  initialFile?: File;
  options?: {
    fileSubtypes?: { [key: string]: string }[];
    hasLength?: boolean;
    hasThumbnailUpload?: boolean;
  };
  onClose: () => void;
  onUploadProgress: (newState: UploaderState) => void;
  onLocalBytes: (bytes: ArrayBuffer, shouldFlip) => void;
}

export const UploadFilesSplat = ({
  fileTypes,
  engineCategory,
  initialFile,
  options,
  onClose,
  onUploadProgress,
  onLocalBytes,
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
  }>({ value: initialFile ?? null });

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

    // const shouldFlip = title.search("ceramic") != -1;
    //
    // assetFile.value.arrayBuffer().then((arrayBuffer) => {
    //   onLocalBytes(arrayBuffer, shouldFlip);
    // }).catch((error) => {
    //   console.error("Error reading file as ArrayBuffer:", error);
    // });

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
    let renderer: WebGLRenderer | null = null;

    if (canvasRef.current && assetFile.value) {
      renderer = loadPreviewOnCanvas({
        file: assetFile.value,
        canvas: canvasRef.current,
        statusCallback: (statusObject: { type: string; message?: string }) => {
          setPreviewStatus(statusObject);
        },
      }).renderer;
    }

    return () => {
      renderer?.setAnimationLoop(null);
      renderer?.dispose();
    }
  }, [assetFile.value]);

  useEffect(() => {
    if (previewStatus.type === "OK" && canvasRef.current) {
      const canvas = canvasRef.current;
      // Defer one animation frame so the splat renderer has produced a visible frame
      const rafId = requestAnimationFrame(() => {
        snapshotCanvasAsThumbnail({
          targetNode: canvas,
          resultCallback: (snapshotBlob) => {
            if (snapshotBlob) {
              setThumbnailFile(snapshotBlob);
            }
          },
        });
      });
      return () => cancelAnimationFrame(rafId);
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
            className="pointer-events-none h-full !w-full"
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
