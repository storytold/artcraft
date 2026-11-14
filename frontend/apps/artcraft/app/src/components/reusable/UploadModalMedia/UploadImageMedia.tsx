
import { useTranslation as useUiTranslation } from "@storyteller/i18n";
import { useState } from "react";
import { H6 } from "~/components";
import { Button } from "@storyteller/ui-button";
import { Input } from "@storyteller/ui-input";
import { FileUploader } from "../UploadModal/FileUploader";
import { UploaderState } from "~/models";
import { uploadImage } from "./uploadImage";

interface Props {
  title: string;
  fileTypes: string[];
  onClose: () => void;
  onUploadProgress: (newState: UploaderState) => void;
}

export const UploadImageMedia = ({
  fileTypes,
  onClose,
  title,
  onUploadProgress,
}: Props) => {
  const { t: translateUi } = useUiTranslation();
  const [uploadTitle, setUploadTitle] = useState<{
    value: string;
    error?: string;
  }>({
    value: "",
  });

  const [assetFile, setAssetFile] = useState<{
    value: File | null;
    error?: string;
    src?: string;
  }>({ value: null });

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
          placeholder={translateUi("Enter the title here")}
          errorMessage={uploadTitle.error}
          value={uploadTitle.value}
          onChange={(event) => setUploadTitle({ value: event.target.value })}
          className={uploadTitle.error ? "mb-3" : ""}
        />
        <FileUploader
          title={title}
          fileTypes={fileTypes}
          file={assetFile.value}
          setFile={(file: File | null) => {
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
          <H6 className="z-10 text-red"> {assetFile.error} </H6>
        )}

        <div className="relative m-auto aspect-square w-full overflow-hidden border border-white/15 bg-ui-controls">
          {!assetFile.value && (
            <H6 className="absolute left-0 top-1/2 -mt-5 w-full text-center">
              {translateUi("File Preview")}</H6>
          )}
          {assetFile.value && (
            <img
              alt={translateUi("file upload preview")}
              className="m-auto max-h-full max-w-full"
              src={assetFile.src}
            />
          )}
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="primary" onClick={handleSubmit}>
            {translateUi("Upload")}</Button>
          <Button variant="secondary" onClick={onClose}>
            {translateUi("Cancel")}</Button>
        </div>
      </div>
    </>
  );
};
