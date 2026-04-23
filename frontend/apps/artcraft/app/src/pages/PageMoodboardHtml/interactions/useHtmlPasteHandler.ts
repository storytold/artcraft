import { useEffect } from "react";
import { useMoodboardStore } from "../../PageMoodboard/MoodboardStore";
import { uploadImage } from "~/components/reusable/UploadModalImage/utilities/uploadImage";
import { worldViewportCenter } from "./htmlStagePointer";

const measure = (url: string): Promise<{ w: number; h: number }> =>
  new Promise((resolve, reject) => {
    const i = new window.Image();
    i.onload = () => resolve({ w: i.naturalWidth, h: i.naturalHeight });
    i.onerror = reject;
    i.src = url;
  });

// HTML analogue of usePasteHandler.ts — drop pasted images at the viewport
// center (derived from canvasSize + viewport in the store, no stageRef needed).
export const useHtmlPasteHandler = (active: boolean) => {
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

      const { canvasSize, viewport } = useMoodboardStore.getState();
      const center = worldViewportCenter(
        canvasSize.width,
        canvasSize.height,
        viewport,
      );

      for (const file of fileItems) {
        const blobUrl = URL.createObjectURL(file);
        try {
          const dims = await measure(blobUrl);
          addImage(blobUrl, center, dims.w, dims.h, null);
        } catch (err) {
          console.error("[MoodboardHtml] paste measure failed", err);
          addImage(blobUrl, center, 320, 320, null);
        }
        uploadImage({
          title: "Pasted image",
          assetFile: file,
          progressCallback: () => {},
        }).catch((err) => {
          console.error("[MoodboardHtml] background upload failed", err);
        });
      }
    };

    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [active, addImage]);
};
