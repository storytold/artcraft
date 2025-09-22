import { useRef } from "react";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { faUpload } from "@fortawesome/pro-solid-svg-icons";
import toast from "react-hot-toast";
import { MediaUploadApi } from "@storyteller/api";
import { v4 as uuidv4 } from "uuid";
import { EIntermediateFile } from "~/enums/EIntermediateFile";

interface Props {
  className?: string;
}

export const UploadImagesButton = ({ className }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => fileInputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArr = Array.from(files);
    const allowedMimes = new Set(["image/jpeg", "image/png"]);
    const allowedExts = new Set([".jpg", ".jpeg", ".png"]);

    const isAllowed = (file: File) => {
      if (allowedMimes.has(file.type)) return true;
      const dot = file.name.lastIndexOf(".");
      const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
      return allowedExts.has(ext);
    };

    const allowedFiles = filesArr.filter(isAllowed);
    const rejected = filesArr.length - allowedFiles.length;

    if (allowedFiles.length === 0) {
      toast.error("Only JPG and PNG images are supported");
      e.target.value = "";
      return;
    }

    if (rejected > 0) {
      toast.error(
        `Skipped ${rejected} unsupported ${rejected === 1 ? "image" : "images"}`,
      );
    }

    const count = allowedFiles.length;
    const mediaUploadApi = new MediaUploadApi();

    const uploads = allowedFiles.map((file) =>
      mediaUploadApi
        .UploadImage({
          blob: file,
          fileName: file.name,
          uuid: uuidv4(),
          maybe_title: file.name,
          is_intermediate_system_file: EIntermediateFile.false,
        })
        .then((res) => {
          if (!res?.success) {
            throw new Error(res?.errorMessage || "Upload failed");
          }
          return res.data;
        }),
    );

    toast.promise(Promise.all(uploads), {
      loading: `Uploading ${count} ${count === 1 ? "image" : "images"}...`,
      success: `Uploaded ${count} ${count === 1 ? "image" : "images"}`,
      error: `Failed to upload ${count} ${count === 1 ? "image" : "images"}`,
    });

    e.target.value = "";
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      <Tooltip content="Upload images" position="bottom" delay={300}>
        <Button
          variant="secondary"
          icon={faUpload}
          className={className || "h-[38px] w-[38px]"}
          onClick={handleClick}
        />
      </Tooltip>
    </>
  );
};
