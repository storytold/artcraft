import { useEffect } from "react";
import Konva from "konva";
import { useMoodboardStore } from "../MoodboardStore";
import {
  DroppedGalleryItem,
  GALLERY_MOODBOARD_DROP_EVENT,
} from "../../galleryDrop";

interface GalleryMoodboardDropDetail {
  item: DroppedGalleryItem;
  canvasPosition: { x: number; y: number };
}

const measure = (url: string): Promise<{ w: number; h: number }> =>
  new Promise((resolve) => {
    const i = new window.Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve({ w: i.naturalWidth, h: i.naturalHeight });
    i.onerror = () => resolve({ w: 320, h: 320 });
    i.src = url;
  });

// Listens for gallery-moodboard-drop CustomEvents dispatched by the
// PageEditor when the user drops a gallery item over the canvas. Mirrors
// PageDraw's gallery-2d-drop listener pattern but scoped to moodboard.
export const useGalleryDropEvent = (
  active: boolean,
  stageRef: React.RefObject<Konva.Stage | null>,
) => {
  const addImage = useMoodboardStore((s) => s.addImage);

  useEffect(() => {
    if (!active) return undefined;

    const handler = async (e: Event) => {
      const ce = e as CustomEvent<GalleryMoodboardDropDetail>;
      const detail = ce.detail;
      if (!detail) return;
      const { item, canvasPosition } = detail;
      const url = item.fullImage || item.thumbnail;
      if (!url) return;

      const stage = stageRef.current;
      const stagePoint = stage
        ? {
            x: (canvasPosition.x - stage.x()) / stage.scaleX(),
            y: (canvasPosition.y - stage.y()) / stage.scaleY(),
          }
        : canvasPosition;

      const dims = await measure(url);
      addImage(url, stagePoint, dims.w, dims.h, item.id ?? null);
    };

    window.addEventListener(GALLERY_MOODBOARD_DROP_EVENT, handler);
    return () =>
      window.removeEventListener(GALLERY_MOODBOARD_DROP_EVENT, handler);
  }, [active, addImage, stageRef]);
};
