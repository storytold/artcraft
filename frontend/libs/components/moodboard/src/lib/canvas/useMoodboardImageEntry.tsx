import { ReactNode, useCallback, useRef, useState } from "react";
import Konva from "konva";
import toast from "react-hot-toast";
import { useMoodboardStore } from "./MoodboardStore";
import { Vec2 } from "./types";
import { measureImage, measureVideo } from "../boards/measureMedia";
import type { MoodboardAdapter, MoodboardPickedItem } from "../adapter";

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

// Owns the file input + library picker that feed the canvas. Upload and the
// library picker are platform seams provided by the adapter (the same one the
// grid uses), so the canvas no longer depends on any app-specific upload util
// or gallery modal.
export const useMoodboardImageEntry = (
  adapter: MoodboardAdapter,
  stageRef: React.RefObject<Konva.Stage | null>,
): UseMoodboardImageEntryReturn => {
  const addImage = useMoodboardStore((s) => s.addImage);
  const addVideo = useMoodboardStore((s) => s.addVideo);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const triggerUpload = useCallback(() => fileInputRef.current?.click(), []);
  const triggerGallery = useCallback(() => {
    if (adapter.renderLibraryPicker) setPickerOpen(true);
    else
      toast("Library picker isn't available here — upload or paste for now", {
        icon: "🖼️",
      });
  }, [adapter]);

  const handleFiles = useCallback(
    async (files: FileList) => {
      const center = stageCenter(stageRef.current);
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const blobUrl = URL.createObjectURL(file);
        const dims = await measureImage(blobUrl);
        addImage(blobUrl, center, dims.w, dims.h, null);
        // Background upload so the image also lands in the user's library.
        adapter.uploadImage?.(file).catch((err) => {
          console.error("[Moodboard] background upload failed", err);
        });
      }
    },
    [addImage, stageRef, adapter],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length) void handleFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePicked = useCallback(
    async (items: MoodboardPickedItem[]) => {
      const center = stageCenter(stageRef.current);
      for (const it of items) {
        if (!it.url) continue;
        if (it.kind === "video") {
          const dims = await measureVideo(it.url);
          addVideo(it.url, center, dims.w, dims.h, it.mediaToken);
        } else {
          const dims = await measureImage(it.url);
          addImage(it.url, center, dims.w, dims.h, it.mediaToken);
        }
      }
      setPickerOpen(false);
    },
    [addImage, addVideo, stageRef],
  );

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
      {adapter.renderLibraryPicker?.({
        open: pickerOpen,
        onClose: () => setPickerOpen(false),
        onPick: (items) => void handlePicked(items),
      })}
    </>
  );

  return { triggerUpload, triggerGallery, modals };
};
