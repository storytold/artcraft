import { FileImageIcon, FileUpIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";

export const DragAndDropZone = ({
  files,
  fileTypes,
  fileIcon = FileImageIcon,
}: {
  files: File[];
  fileTypes: string[];
  fileIcon?: LucideIcon;
}) => {
  if (files.length === 0) {
    return (
      <div className="flex cursor-pointer items-center gap-3.5 rounded-none border border-dashed border-white/20 bg-white/[0.02] p-3 transition-colors hover:border-white/40 hover:bg-white/[0.05]">
        <FileUpIcon className="text-4xl text-white/60" />
        <div className="flex flex-col gap-0">
          <p className="font-medium">
            <u>Upload a file</u> or drop it here
          </p>

          <p className="flex items-center gap-2 font-mono text-[11px] font-normal uppercase tracking-[0.12em] opacity-50">
            {fileTypes.join(", ").toString()} supported
          </p>
        </div>
      </div>
    );
  }

  if (files.length === 1) {
    const file = files[0];
    const fileName = file.name.split(".")[0].toUpperCase();
    const fileSize =
      file.size >= 1024 * 1024
        ? (file.size / 1024 / 1024).toFixed(2) + " MB"
        : `${Math.floor(file.size / 1024)} KB`;

    return (
      <div className="flex cursor-pointer items-center justify-between gap-3.5 rounded-none border border-dashed border-white/20 bg-white/[0.02] p-3 transition-colors hover:border-white/40 hover:bg-white/[0.05]">
        <DynamicIcon icon={fileIcon} className="text-4xl" />
        <div className="flex grow flex-col gap-0">
          <p className="font-medium">
            {file.name.slice(0, file.name.lastIndexOf("."))}
          </p>
          <p className="flex items-center gap-2 text-sm font-normal">
            <span className="opacity-50">
              {`${fileName} file size: ${fileSize} `}
            </span>
            <u className="transition-all hover:text-white/80">Change File</u>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex cursor-pointer items-center justify-between gap-3.5 rounded-none border border-dashed border-white/20 bg-white/[0.02] p-3 transition-colors hover:border-white/40 hover:bg-white/[0.05]">
      <DynamicIcon icon={fileIcon} className="text-4xl" />
      <div className="flex grow flex-col gap-0">
        <p className="font-medium">{files.length} files selected</p>
        <p className="flex items-center gap-2 text-sm font-normal">
          <u className="transition-all hover:text-white/80">Change Files</u>
        </p>
      </div>
    </div>
  );
};
