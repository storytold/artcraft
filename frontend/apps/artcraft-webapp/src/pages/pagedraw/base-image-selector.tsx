// The "no base image yet" state for the webapp's image editor.
//
// PageDraw renders this (via adapter.renderBaseImageSelector) until the user
// picks a base image. It offers three entry points, mirroring the Tauri app's
// BaseImageSelector but built from the webapp's own primitives:
//   - upload a local file        → webapp uploadImage helper → media token
//   - pick from your library      → GalleryModal in select mode
//   - start from a blank canvas   → BlankCanvasModal (from the lib)

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExpand,
  faImages,
  faPencil,
  faSpinnerThird,
} from "@fortawesome/pro-solid-svg-icons";
import { UploaderStates } from "@storyteller/common";
import { MediaFilesApi } from "@storyteller/api";
import {
  GalleryModal,
  type GalleryItem,
} from "@storyteller/ui-gallery-modal";
import {
  BlankCanvasModal,
  type BaseSelectorImage,
} from "@storyteller/ui-pagedraw";
import { uploadImage } from "../../components/prompt-box/upload-image";
import { showToast } from "../../components/toast/toast";

type BaseImageSelectorProps = {
  onImageSelect: (image: BaseSelectorImage) => void;
  showLoading?: boolean;
};

export function BaseImageSelector({
  onImageSelect,
  showLoading = false,
}: BaseImageSelectorProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [gallerySelectedIds, setGallerySelectedIds] = useState<string[]>([]);
  const [isBlankCanvasOpen, setIsBlankCanvasOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const busy = isUploading || showLoading;

  const handleGallerySelect = (id: string) =>
    // Single-select: clicking always swaps to the latest pick.
    setGallerySelectedIds((prev) => (prev.includes(id) ? [] : [id]));

  const handleUseGalleryImages = (items: GalleryItem[]) => {
    const item = items[0];
    if (!item) {
      showToast("error", "No image selected");
      return;
    }
    setIsGalleryOpen(false);
    setGallerySelectedIds([]);
    onImageSelect({
      mediaToken: item.id,
      url: item.fullImage || item.thumbnail || "",
      fullImageUrl: item.fullImage || undefined,
      thumbnailUrlTemplate: item.thumbnailUrlTemplate,
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

  const handleFile = (file: File) => {
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      await uploadImage({
        title: `edit-image-${Math.random().toString(36).substring(2, 15)}`,
        assetFile: file,
        progressCallback: (state) => {
          if (state.status === UploaderStates.success && state.data) {
            void resolveAndSelect(state.data, dataUrl);
          } else if (
            state.status === UploaderStates.assetError ||
            state.status === UploaderStates.imageCreateError
          ) {
            showToast("error", "Upload failed. Please try again.");
            setIsUploading(false);
          }
        },
      });
    };
    reader.readAsDataURL(file);
  };

  // The uploader hands back a media token immediately; fetch the media file to
  // swap the local data URL for a durable CDN URL (and grab the thumbnail
  // template) before handing the base image to the editor.
  const resolveAndSelect = async (mediaToken: string, fallbackUrl: string) => {
    let url = fallbackUrl;
    let thumbnailUrlTemplate: string | undefined;
    try {
      const result = await new MediaFilesApi().GetMediaFileByToken({
        mediaFileToken: mediaToken,
      });
      if (result.success && result.data) {
        url = result.data.media_links?.cdn_url || url;
        thumbnailUrlTemplate =
          result.data.media_links?.thumbnail_template ?? thumbnailUrlTemplate;
      }
    } catch {
      // Fall back to the data URL — the editor can still render it.
    }
    onImageSelect({ mediaToken, url, fullImageUrl: url, thumbnailUrlTemplate });
    setIsUploading(false);
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) handleFile(file);
  };

  return (
    <>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`flex h-full w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? "border-primary-400 bg-primary/10"
            : "border-ui-panel-border bg-ui-background hover:border-primary-400/50"
        } ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileInput}
          disabled={busy}
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary-400/30 bg-primary/30 text-primary-300">
          <FontAwesomeIcon
            icon={busy ? faSpinnerThird : faPencil}
            className={`text-xl ${busy ? "animate-spin" : ""}`}
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-base-fg">Edit Image</h2>
          <p className="mt-1 text-sm text-base-fg/60">
            Click to upload or drag and drop an image here to edit
          </p>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsGalleryOpen(true);
            }}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg border border-ui-controls-border bg-ui-controls px-3 py-2 text-sm font-medium text-base-fg transition-colors hover:bg-ui-controls/80"
          >
            <FontAwesomeIcon icon={faImages} />
            Pick from Library
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsBlankCanvasOpen(true);
            }}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg border border-ui-controls-border bg-ui-controls px-3 py-2 text-sm font-medium text-base-fg transition-colors hover:bg-ui-controls/80"
          >
            <FontAwesomeIcon icon={faExpand} />
            Blank Canvas
          </button>
        </div>
      </label>

      <GalleryModal
        mode="select"
        isOpen={isGalleryOpen}
        onClose={() => {
          setIsGalleryOpen(false);
          setGallerySelectedIds([]);
        }}
        selectedItemIds={gallerySelectedIds}
        onSelectItem={handleGallerySelect}
        maxSelections={1}
        onUseSelected={handleUseGalleryImages}
        forceFilter="image"
      />

      <BlankCanvasModal
        isOpen={isBlankCanvasOpen}
        onClose={() => setIsBlankCanvasOpen(false)}
        onConfirm={handleBlankCanvasConfirm}
      />
    </>
  );
}
