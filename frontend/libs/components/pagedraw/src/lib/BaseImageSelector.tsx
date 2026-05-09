import { useCallback, useRef, useState } from "react";
import { faExpand, faImages, faPencil, faUpload } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";
import { Button } from "@storyteller/ui-button";
import { GalleryModal, type GalleryItem } from "@storyteller/ui-gallery-modal";
import { downloadFileFromUrl, MediaFilesApi } from "@storyteller/api";
import { UploaderStates } from "@storyteller/common";
import { HelpMenuButton } from "@storyteller/ui-help-menu";
import { CostCalculatorButton } from "@storyteller/ui-pricing-modal";
import { ModelPage } from "@storyteller/ui-model-selector";
import { BlankCanvasModal } from "./BlankCanvasModal";
import type { PageDrawAdapter } from "./adapter";
import type { BaseSelectorImage } from "./types";

const MAX_GALLERY_SELECTIONS = 1;

interface BaseImageSelectorProps {
  adapter: PageDrawAdapter;
  onImageSelect: (image: BaseSelectorImage) => void;
  showLoading?: boolean;
}

export const BaseImageSelector = ({
  adapter,
  onImageSelect,
  showLoading = false,
}: BaseImageSelectorProps) => {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [gallerySelectedIds, setGallerySelectedIds] = useState<string[]>([]);
  const [isBlankCanvasOpen, setIsBlankCanvasOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const toast = (type: "success" | "error" | "info", message: string) => {
    if (adapter.showToast) {
      adapter.showToast(type, message);
    } else if (type === "error") {
      console.error(message);
    } else {
      console.log(message);
    }
  };

  const handleGallerySelectItem = (mediaToken: string) => {
    setGallerySelectedIds((prev) => {
      if (prev.includes(mediaToken)) return prev.filter((x) => x !== mediaToken);
      return [mediaToken];
    });
  };

  const handleGalleryUseSelected = (selectedItems: GalleryItem[]) => {
    const item = selectedItems[0];
    if (!item || !item.fullImage) {
      toast("error", "No image selected");
      return;
    }
    setIsGalleryOpen(false);
    setGallerySelectedIds([]);
    onImageSelect({
      url: item.fullImage,
      mediaToken: item.id,
      thumbnailUrlTemplate: item.thumbnailUrlTemplate,
      fullImageUrl: item.fullImage,
    });
  };

  const handleBlankCanvasConfirm = (width: number, height: number) => {
    setIsBlankCanvasOpen(false);
    onImageSelect({
      url: "",
      mediaToken: `blank_canvas_${width}x${height}_${Math.random()
        .toString(36)
        .substring(2, 8)}`,
      isBlankCanvas: true,
      blankCanvasWidth: width,
      blankCanvasHeight: height,
    });
  };

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const file = Array.from(files)[0];
      if (!file || !adapter.uploadImage) {
        if (!adapter.uploadImage) toast("error", "Image upload not available");
        return;
      }
      setIsUploading(true);

      const reader = new FileReader();
      reader.onloadend = () => {
        adapter.uploadImage!({
          title: `pagedraw-${Math.random().toString(36).substring(2, 10)}`,
          assetFile: file,
          progressCallback: async (state) => {
            if (state.status === UploaderStates.success && state.data) {
              const mediaToken = state.data;
              let finalUrl = reader.result as string;
              let thumbnailUrlTemplate: string | undefined;
              try {
                const api = new MediaFilesApi();
                const result = await api.GetMediaFileByToken({
                  mediaFileToken: mediaToken,
                });
                if (result.success && result.data) {
                  finalUrl =
                    result.data.media_links?.cdn_url ||
                    result.data.public_bucket_url ||
                    finalUrl;
                  const links = result.data.media_links as
                    | { thumbnail_template?: string; maybe_thumbnail_template?: string }
                    | undefined;
                  thumbnailUrlTemplate =
                    links?.thumbnail_template || links?.maybe_thumbnail_template;
                }
              } catch {
                // fall back to data URL
              }
              onImageSelect({
                url: finalUrl,
                mediaToken,
                fullImageUrl: finalUrl,
                thumbnailUrlTemplate,
              });
              toast("success", "Image uploaded successfully!");
              setIsUploading(false);
            } else if (
              state.status === UploaderStates.assetError ||
              state.status === UploaderStates.imageCreateError
            ) {
              toast("error", "Upload failed. Please try again.");
              setIsUploading(false);
            }
          },
        });
      };
      reader.readAsDataURL(file);
    },
    [adapter, onImageSelect],
  );

  const disabled = isUploading || showLoading;

  return (
    <>
      <div className="flex h-full w-full items-center justify-center overflow-hidden bg-ui-panel text-base-fg">
        <div className="aspect-video w-full max-w-5xl bg-ui-background">
          <UploadCard
            disabled={disabled}
            onFilesSelected={handleFiles}
            onPickFromLibrary={() => setIsGalleryOpen(true)}
            onCreateBlankCanvas={() => setIsBlankCanvasOpen(true)}
          />
        </div>
      </div>
      <div className="fixed bottom-6 right-6 z-20 flex items-center gap-2">
        <CostCalculatorButton modelPage={ModelPage.ImageEditor} />
        <HelpMenuButton />
      </div>
      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => {
          setIsGalleryOpen(false);
          setGallerySelectedIds([]);
        }}
        mode="select"
        selectedItemIds={gallerySelectedIds}
        onSelectItem={handleGallerySelectItem}
        maxSelections={MAX_GALLERY_SELECTIONS}
        onUseSelected={handleGalleryUseSelected}
        onDownloadClicked={downloadFileFromUrl}
        forceFilter="image"
      />
      <BlankCanvasModal
        isOpen={isBlankCanvasOpen}
        onClose={() => setIsBlankCanvasOpen(false)}
        onConfirm={handleBlankCanvasConfirm}
      />
    </>
  );
};

// ─── UploadCard (drag/drop entry tile) ─────────────────────────────────────────

interface UploadCardProps {
  disabled: boolean;
  onFilesSelected: (files: FileList) => void;
  onPickFromLibrary: () => void;
  onCreateBlankCanvas: () => void;
}

const UploadCard = ({
  disabled,
  onFilesSelected,
  onPickFromLibrary,
  onCreateBlankCanvas,
}: UploadCardProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const resetInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFiles = (files?: FileList | null) => {
    if (!files || files.length === 0) return;
    onFilesSelected(files);
    resetInput();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragActive(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragActive(false);
    handleFiles(e.dataTransfer?.files);
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={twMerge(
        "bg-ui-background/60 relative flex h-full flex-col items-center justify-center gap-8 overflow-hidden rounded-2xl border-2 border-dashed border-ui-panel-border p-10 text-center transition-colors",
        isDragActive && "border-primary/80 bg-primary/5",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex h-32 w-32 items-center justify-center rounded-2xl border-2 border-blue-400/30 bg-blue-500/40 shadow-xl backdrop-blur-sm">
          <FontAwesomeIcon icon={faPencil} className="text-5xl text-white drop-shadow-lg" />
        </div>
        <div className="space-y-3">
          <h3 className="text-4xl font-bold tracking-tight text-base-fg">Edit Image</h3>
          <p className="mx-auto max-w-md text-base leading-relaxed text-base-fg/70">
            Click to upload or drag and drop an image here to edit
          </p>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          <Button
            variant="primary"
            icon={faUpload}
            onClick={() => !disabled && fileInputRef.current?.click()}
            className="px-8 py-3 text-base font-semibold shadow-lg"
            disabled={disabled}
          >
            Select Image
          </Button>
          <Button
            variant="action"
            icon={faImages}
            onClick={onPickFromLibrary}
            className="border-2 px-8 py-3 text-base font-semibold"
            disabled={disabled}
          >
            Pick from Library
          </Button>
          <Button
            variant="action"
            icon={faExpand}
            onClick={onCreateBlankCanvas}
            className="border-2 px-8 py-3 text-base font-semibold"
            disabled={disabled}
          >
            Blank Canvas
          </Button>
        </div>
      </div>
    </div>
  );
};
