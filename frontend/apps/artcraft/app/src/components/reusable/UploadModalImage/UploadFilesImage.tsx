import { useState } from "react";
import { Button } from "@storyteller/ui-button";
import { FileUploader } from "@storyteller/ui-file-uploader";
import { uploadImage } from "./utilities/uploadImage";
import { UploaderState } from "../../../models";

interface Props {
  title: string;
  fileTypes: string[];
  initialFile?: File;
  onClose: () => void;
  onUploadProgress: (newState: UploaderState) => void;
}

export const UploadFilesImage = ({
  fileTypes,
  initialFile,
  onClose,
  onUploadProgress,
}: Props) => {
  const [assetFile, setAssetFile] = useState<{
    value: File | null;
    error?: string;
  }>({ value: initialFile ?? null });

  const handleSubmit = () => {
    if (!assetFile.value) {
      setAssetFile((curr) => ({
        ...curr,
        error: "Please select an image to upload.",
      }));
      return;
    }

    // Use the filename as the title
    const title = assetFile.value.name.split(".")[0];

    uploadImage({
      title: title,
      assetFile: assetFile.value,
      progressCallback: onUploadProgress,
    });
  };

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

        {assetFile.error && (
          <h6 className="z-10 text-red">{assetFile.error}</h6>
        )}

        {assetFile.value && (
          <div className="relative m-auto flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-brand-secondary">
            <img
              alt="Preview"
              className="m-auto max-h-full max-w-full object-contain"
              src={URL.createObjectURL(assetFile.value)}
            />
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Upload
          </Button>
        </div>
      </div>
    </>
  );
};
