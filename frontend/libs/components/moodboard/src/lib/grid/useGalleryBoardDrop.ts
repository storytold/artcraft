import { useEffect } from "react";
import { useBoardLibraryStore } from "../boards/BoardLibraryStore";
import { measureImage } from "../boards/measureMedia";
import {
  DroppedGalleryItem,
  GALLERY_MOODBOARD_DROP_EVENT,
} from "../galleryDrop";

interface GalleryMoodboardDropDetail {
  item: DroppedGalleryItem;
}

// Grid counterpart to the canvas's useGalleryDropEvent: appends a dropped
// gallery item to the active board. The masonry is position-independent, so we
// ignore the drop coordinates the canvas uses for placement.
export const useGalleryBoardDrop = (active: boolean) => {
  useEffect(() => {
    if (!active) return undefined;

    const handler = async (e: Event) => {
      const ce = e as CustomEvent<GalleryMoodboardDropDetail>;
      const item = ce.detail?.item;
      const url = item?.fullImage || item?.thumbnail;
      if (!url) return;

      const store = useBoardLibraryStore.getState();
      const boardId = store.ensureActiveBoard();
      const dims = await measureImage(url);
      store.addImageItem(boardId, {
        src: url,
        mediaId: item.id ?? null,
        naturalW: dims.w,
        naturalH: dims.h,
      });
    };

    window.addEventListener(GALLERY_MOODBOARD_DROP_EVENT, handler);
    return () =>
      window.removeEventListener(GALLERY_MOODBOARD_DROP_EVENT, handler);
  }, [active]);
};
