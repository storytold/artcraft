import { useCallback, useRef, useState } from "react";
import { UploadIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { Button } from "@storyteller/ui-button";
import { twMerge } from "tailwind-merge";

interface UploadEntryCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  accentBackgroundClass: string;
  accentBorderClass?: string;
  accept?: string;
  multiple?: boolean;
  primaryLabel: string;
  primaryIcon?: LucideIcon;
  onFilesSelected: (files: FileList) => void;
  secondaryLabel?: string;
  secondaryIcon?: LucideIcon;
  onSecondaryClick?: () => void;
  tertiaryLabel?: string;
  tertiaryIcon?: LucideIcon;
  onTertiaryClick?: () => void;
  disabled?: boolean;
}

export const UploadEntryCard = ({
  icon,
  title,
  description,
  accentBackgroundClass,
  accentBorderClass,
  accept,
  multiple,
  primaryLabel,
  primaryIcon = UploadIcon,
  onFilesSelected,
  secondaryLabel,
  secondaryIcon,
  onSecondaryClick,
  tertiaryLabel,
  tertiaryIcon,
  onTertiaryClick,
  disabled,
}: UploadEntryCardProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const resetInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFiles = useCallback(
    (files?: FileList | null) => {
      if (!files || files.length === 0) return;
      onFilesSelected(files);
      resetInput();
    },
    [onFilesSelected],
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
  };

  const handlePrimaryClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    setIsDragActive(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    setIsDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    if (event.currentTarget.contains(event.relatedTarget as Node)) {
      return;
    }
    setIsDragActive(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    setIsDragActive(false);
    handleFiles(event.dataTransfer?.files);
  };

  return (
    <div
      className={twMerge(
        "relative flex h-full flex-col items-center justify-center gap-6 overflow-hidden rounded-[3px] border border-dashed border-white/15 bg-ui-background p-8 text-center transition-colors hover:border-white/40",
        isDragActive && "border-white bg-white/10 hover:border-white",
        disabled && "pointer-events-none opacity-60",
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        disabled={disabled}
      />
      <div className="flex flex-col items-center gap-4">
        <div
          className={twMerge(
            "flex h-14 w-14 items-center justify-center border",
            accentBackgroundClass,
            accentBorderClass,
          )}
        >
          <DynamicIcon icon={icon} className="text-xl text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-base-fg">{title}</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-base-fg/60">
            {description}
          </p>
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Button
            variant="primary"
            icon={primaryIcon}
            onClick={handlePrimaryClick}
            className="px-3 py-2"
            disabled={disabled}
          >
            {primaryLabel}
          </Button>
          {secondaryLabel && onSecondaryClick && (
            <Button
              variant="action"
              icon={secondaryIcon}
              onClick={onSecondaryClick}
              className="px-3 py-2"
              disabled={disabled}
            >
              {secondaryLabel}
            </Button>
          )}
          {tertiaryLabel && onTertiaryClick && (
            <Button
              variant="action"
              icon={tertiaryIcon}
              onClick={onTertiaryClick}
              className="px-3 py-2"
              disabled={disabled}
            >
              {tertiaryLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadEntryCard;
