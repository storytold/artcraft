import { useEffect } from "react";
import Konva from "konva";
import { useMoodboardStore } from "../MoodboardStore";
import type { MoodboardAdapter } from "../../adapter";

// Loads natural dimensions for an image URL.
const measure = (url: string): Promise<{ w: number; h: number }> =>
  new Promise((resolve, reject) => {
    const i = new window.Image();
    i.onload = () => resolve({ w: i.naturalWidth, h: i.naturalHeight });
    i.onerror = reject;
    i.src = url;
  });

// Listens for paste events while the moodboard page is mounted. For each
// image entry on the clipboard, immediately drops a blob-URL image onto the
// canvas at the viewport center, then asynchronously uploads it to the
// library so it lives in the user's gallery.
export const usePasteHandler = (
  adapter: MoodboardAdapter,
  active: boolean,
  stageRef: React.RefObject<Konva.Stage | null>,
) => {
  const addImage = useMoodboardStore((s) => s.addImage);

  useEffect(() => {
    if (!active) return undefined;

    const handler = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /input|textarea/i.test(target.tagName)) return;
      if (target && target.isContentEditable) return;

      const items = e.clipboardData?.items;
      if (!items) return;
      const fileItems: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.kind === "file" && it.type.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) fileItems.push(f);
        }
      }
      if (fileItems.length === 0) return;
      e.preventDefault();

      const stage = stageRef.current;
      const center = stage
        ? { x: stage.width() / 2, y: stage.height() / 2 }
        : { x: 400, y: 400 };

      for (const file of fileItems) {
        const blobUrl = URL.createObjectURL(file);
        try {
          const dims = await measure(blobUrl);
          addImage(blobUrl, center, dims.w, dims.h, null);
        } catch (err) {
          console.error("[Moodboard] paste measure failed", err);
          addImage(blobUrl, center, 320, 320, null);
        }
        // Fire-and-forget: also push to the platform's media library so the
        // image persists in the user's gallery.
        adapter.uploadImage?.(file).catch((err) => {
          console.error("[Moodboard] background upload failed", err);
        });
      }
    };

    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [adapter, active, addImage, stageRef]);
};
