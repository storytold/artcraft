// UploadImageMedia: the "ready" form inside UploadImageMediaModal. Same layout as UploadFilesMedia but images only:
// title input, file picker, preview, Upload/Cancel. Upload calls uploadImage() (same folder, re-exported from @storyteller/api).

import { useState } from "react";
import { Button } from "@storyteller/ui-button";
import { Input } from "@storyteller/ui-input";
import { FileUploader } from "@storyteller/ui-file-uploader";
import { UploaderState } from "~/models";
import { uploadImage } from "./uploadImage";

// fileTypes: allowed extensions; onClose: Cancel button; onUploadProgress: receives each upload status change.
interface Props {
  title: string;
  fileTypes: string[];
  onClose: () => void;
  onUploadProgress: (newState: UploaderState) => void;
}

/**
 * Upload form for one image. Validates title + file, then starts the upload (progress is reported through onUploadProgress).
 */
export const UploadImageMedia = ({
  fileTypes,
  onClose,
  onUploadProgress,
}: Props) => {
  // Title text plus an optional validation error message.
  const [uploadTitle, setUploadTitle] = useState<{
    value: string;
    error?: string;
  }>({
    value: "",
  });

  // The chosen file, its local preview URL (src) and an optional validation error.
  const [assetFile, setAssetFile] = useState<{
    value: File | null;
    error?: string;
    src?: string;
  }>({ value: null });

  // Show an inline error if the title or file is missing, otherwise hand both to uploadImage.
  const handleSubmit = () => {
    if (!uploadTitle.value) {
      setUploadTitle((curr) => ({
        ...curr,
        error: "Please enter a title.",
      }));
      return;
    }

    if (!assetFile.value) {
      setAssetFile((curr) => ({
        ...curr,
        error: "Please select a file to upload.",
      }));
      return;
    }

    uploadImage({
      title: uploadTitle.value,
      assetFile: assetFile.value,
      progressCallback: onUploadProgress,
    });
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-4">
        <Input
          placeholder="Enter the title here"
          errorMessage={uploadTitle.error}
          value={uploadTitle.value}
          onChange={(event) => setUploadTitle({ value: event.target.value })}
          className={uploadTitle.error ? "mb-3" : ""}
        />
        <FileUploader
          fileTypes={fileTypes}
          files={assetFile.value ? [assetFile.value] : []}
          handleChange={(files: File[]) => {
            // The shared uploader reports an array; this modal only keeps one file.
            const file = files[0] ?? null;
            if (file !== null) {
              setAssetFile({
                value: file,
                src: URL.createObjectURL(file),
              });
            } else {
              setAssetFile({ value: null });
            }
          }}
        />
        {assetFile.error && (
          <h6 className="z-10 text-red"> {assetFile.error} </h6>
        )}

        <div className="relative m-auto aspect-square w-full overflow-hidden border border-white/15 bg-ui-controls">
          {!assetFile.value && (
            <h6 className="absolute left-0 top-1/2 -mt-5 w-full text-center">
              File Preview
            </h6>
          )}
          {assetFile.value && (
            <img
              alt="file upload preview"
              className="m-auto max-h-full max-w-full"
              src={assetFile.src}
            />
          )}
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="primary" onClick={handleSubmit}>
            Upload
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
};
