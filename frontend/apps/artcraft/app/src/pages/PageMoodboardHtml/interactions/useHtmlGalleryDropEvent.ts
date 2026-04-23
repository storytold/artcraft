import { useEffect } from "react";
import { useMoodboardStore } from "../../PageMoodboard/MoodboardStore";

interface GalleryItem {
  id?: string;
  thumbnail?: string | null;
  fullImage?: string | null;
  mediaClass?: string;
}

// canvasPosition from the PageEditor dispatcher is already container-local
// (the dispatcher subtracts the stage container's rect.left/top before
// dispatching). We only need to undo the pan/zoom to map to world coords.
interface GalleryMoodboardDropDetail {
  item: GalleryItem;
  canvasPosition: { x: number; y: number };
}

const measureImage = (url: string): Promise<{ w: number; h: number }> =>
  new Promise((resolve) => {
    const i = new window.Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve({ w: i.naturalWidth, h: i.naturalHeight });
    i.onerror = () => resolve({ w: 320, h: 320 });
    i.src = url;
  });

const measureVideo = (url: string): Promise<{ w: number; h: number }> =>
  new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.crossOrigin = "anonymous";
    v.muted = true;
    v.onloadedmetadata = () =>
      resolve({ w: v.videoWidth || 320, h: v.videoHeight || 320 });
    v.onerror = () => resolve({ w: 320, h: 320 });
    v.src = url;
  });

// HTML analogue of useGalleryDropEvent.ts. Converts container-local drop
// coords to world coords by undoing pan/zoom — matches the Konva version
// (which uses stage.x()/scaleX()) but with store-derived viewport instead.
export const useHtmlGalleryDropEvent = (
  active: boolean,
  _containerRef: React.RefObject<HTMLDivElement | null>,
) => {
  const addImage = useMoodboardStore((s) => s.addImage);
  const addVideo = useMoodboardStore((s) => s.addVideo);

  useEffect(() => {
    if (!active) return undefined;

    const handler = async (e: Event) => {
      const ce = e as CustomEvent<GalleryMoodboardDropDetail>;
      const detail = ce.detail;
      if (!detail) return;
      const { item, canvasPosition } = detail;
      const url = item.fullImage || item.thumbnail;
      if (!url) return;

      const { viewport } = useMoodboardStore.getState();
      const stagePoint = {
        x: (canvasPosition.x - viewport.pan.x) / viewport.zoom,
        y: (canvasPosition.y - viewport.pan.y) / viewport.zoom,
      };

      if (item.mediaClass === "video") {
        const dims = await measureVideo(url);
        addVideo(url, stagePoint, dims.w, dims.h, item.id ?? null);
      } else {
        const dims = await measureImage(url);
        addImage(url, stagePoint, dims.w, dims.h, item.id ?? null);
      }
    };

    window.addEventListener("gallery-moodboard-drop", handler);
    return () =>
      window.removeEventListener("gallery-moodboard-drop", handler);
  }, [active, addImage, addVideo]);
};
