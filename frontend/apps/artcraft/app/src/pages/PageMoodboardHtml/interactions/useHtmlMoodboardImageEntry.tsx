import { ReactNode, useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import { downloadFileFromUrl } from "libs/api/src/lib/LocalApi";
import {
  GalleryModal,
  GalleryItem,
} from "@storyteller/ui-gallery-modal";
import { uploadImage } from "~/components/reusable/UploadModalImage/utilities/uploadImage";
import { useMoodboardStore } from "../../PageMoodboard/MoodboardStore";
import { worldViewportCenter } from "./htmlStagePointer";

const measure = (url: string): Promise<{ w: number; h: number }> =>
  new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 320, h: 320 });
    img.src = url;
  });

interface UseReturn {
  triggerUpload: () => void;
  triggerGallery: () => void;
  modals: ReactNode;
}

// HTML analogue of useMoodboardImageEntry.tsx. Center is read from the store's
// canvasSize + viewport instead of a Konva stage, so no stageRef is needed.
export const useHtmlMoodboardImageEntry = (): UseReturn => {
  const addImage = useMoodboardStore((s) => s.addImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedGalleryIds, setSelectedGalleryIds] = useState<string[]>([]);

  const triggerUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const triggerGallery = useCallback(() => {
    setGalleryOpen(true);
  }, []);

  const getCenter = () => {
    const { canvasSize, viewport } = useMoodboardStore.getState();
    return worldViewportCenter(canvasSize.width, canvasSize.height, viewport);
  };

  const handleFiles = useCallback(
    async (files: FileList) => {
      const center = getCenter();
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const blobUrl = URL.createObjectURL(file);
        try {
          const dims = await measure(blobUrl);
          addImage(blobUrl, center, dims.w, dims.h, null);
        } catch {
          addImage(blobUrl, center, 320, 320, null);
        }
        uploadImage({
          title: file.name || "Moodboard image",
          assetFile: file,
          progressCallback: () => {},
        }).catch((err) => {
          console.error("[MoodboardHtml] background upload failed", err);
        });
      }
    },
    [addImage],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length) {
      void handleFiles(files);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGalleryClose = () => {
    setGalleryOpen(false);
    setSelectedGalleryIds([]);
  };

  const handleGallerySelectItem = (id: string) => {
    setSelectedGalleryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleUseSelected = async (items: GalleryItem[]) => {
    if (items.length === 0) {
      toast.error("No image selected");
      return;
    }
    const center = getCenter();
    for (const item of items) {
      const url = item.fullImage || item.thumbnail;
      if (!url) continue;
      const dims = await measure(url);
      addImage(url, center, dims.w, dims.h, item.id ?? null);
    }
    handleGalleryClose();
  };

  const modals = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <GalleryModal
        isOpen={galleryOpen}
        onClose={handleGalleryClose}
        mode="select"
        selectedItemIds={selectedGalleryIds}
        onSelectItem={handleGallerySelectItem}
        onUseSelected={handleUseSelected}
        onDownloadClicked={downloadFileFromUrl}
        forceFilter="image"
      />
    </>
  );

  return { triggerUpload, triggerGallery, modals };
};
