import { ReactNode, useCallback, useRef, useState } from "react";
import Konva from "konva";
import toast from "react-hot-toast";
import { downloadFileFromUrl } from "libs/api/src/lib/LocalApi";
import {
  GalleryModal,
  GalleryItem,
} from "@storyteller/ui-gallery-modal";
import { uploadImage } from "~/components/reusable/UploadModalImage/utilities/uploadImage";
import { useMoodboardStore } from "./MoodboardStore";
import { Vec2 } from "./types";

const measure = (url: string): Promise<{ w: number; h: number }> =>
  new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 320, h: 320 });
    img.src = url;
  });

const stageCenter = (stage: Konva.Stage | null): Vec2 => {
  if (!stage) return { x: 400, y: 400 };
  return {
    x: (stage.width() / 2 - stage.x()) / stage.scaleX(),
    y: (stage.height() / 2 - stage.y()) / stage.scaleY(),
  };
};

interface UseMoodboardImageEntryReturn {
  triggerUpload: () => void;
  triggerGallery: () => void;
  modals: ReactNode;
}

// Owns the file input + GalleryModal that feed the moodboard. Both the empty
// state CTA and the toolbar `+` dropdown drive the same triggers, so the
// upload + library flows are defined once here.
export const useMoodboardImageEntry = (
  stageRef: React.RefObject<Konva.Stage | null>,
): UseMoodboardImageEntryReturn => {
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

  const handleFiles = useCallback(
    async (files: FileList) => {
      const center = stageCenter(stageRef.current);
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const blobUrl = URL.createObjectURL(file);
        try {
          const dims = await measure(blobUrl);
          addImage(blobUrl, center, dims.w, dims.h, null);
        } catch {
          addImage(blobUrl, center, 320, 320, null);
        }
        // Background upload so the image lands in the user's library too.
        uploadImage({
          title: file.name || "Moodboard image",
          assetFile: file,
          progressCallback: () => {},
        }).catch((err) => {
          console.error("[Moodboard] background upload failed", err);
        });
      }
    },
    [addImage, stageRef],
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
    const center = stageCenter(stageRef.current);
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
