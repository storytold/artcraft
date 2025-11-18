import { useCallback, useRef, useState } from "react";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload } from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import { twMerge } from "tailwind-merge";

interface UploadEntryCardProps {
  icon: IconDefinition;
  title: string;
  description: string;
  accentBackgroundClass: string;
  accentBorderClass?: string;
  accept?: string;
  multiple?: boolean;
  primaryLabel: string;
  primaryIcon?: IconDefinition;
  onFilesSelected: (files: FileList) => void;
  secondaryLabel?: string;
  secondaryIcon?: IconDefinition;
  onSecondaryClick?: () => void;
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
  primaryIcon = faUpload,
  onFilesSelected,
  secondaryLabel,
  secondaryIcon,
  onSecondaryClick,
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
        "bg-ui-background/60 relative flex h-full flex-col items-center justify-center gap-8 overflow-hidden rounded-2xl border-2 border-dashed border-ui-panel-border p-10 text-center transition-colors",
        isDragActive && "border-primary/80 bg-primary/5",
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
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div
            className={twMerge(
              "relative flex h-32 w-32 items-center justify-center rounded-2xl border-2 shadow-xl backdrop-blur-sm",
              accentBackgroundClass,
              accentBorderClass,
            )}
          >
            <FontAwesomeIcon
              icon={icon}
              className="text-5xl text-white drop-shadow-lg"
            />
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-4xl font-bold tracking-tight text-base-fg">
            {title}
          </h3>
          <p className="mx-auto max-w-md text-base leading-relaxed text-base-fg/70">
            {description}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          <Button
            variant="primary"
            icon={primaryIcon}
            onClick={handlePrimaryClick}
            className="px-8 py-3 text-base font-semibold shadow-lg"
            disabled={disabled}
          >
            {primaryLabel}
          </Button>
          {secondaryLabel && onSecondaryClick && (
            <Button
              variant="action"
              icon={secondaryIcon}
              onClick={onSecondaryClick}
              className="border-2 px-8 py-3 text-base font-semibold"
              disabled={disabled}
            >
              {secondaryLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadEntryCard;
