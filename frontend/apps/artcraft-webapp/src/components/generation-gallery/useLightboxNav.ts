import { useCallback, useState } from "react";
import { useLastViewedGenerationStore } from "@storyteller/ui-generation-list";
import type { GalleryItem } from "./useGalleryData";

export function useLightboxNav(flatItems: GalleryItem[]) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  // Every lightbox show (open and prev/next) moves the "Last viewed" marker
  // so the feed can badge that tile after the lightbox closes.
  const showItem = useCallback((item: GalleryItem) => {
    useLastViewedGenerationStore.getState().setId(item.id);
    setLightboxItem(item);
  }, []);

  const handleGalleryItemClick = useCallback(
    (item: GalleryItem) => {
      showItem(item);
      setLightboxOpen(true);
    },
    [showItem],
  );

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setLightboxItem(null);
  }, []);

  const currentIndex = lightboxItem
    ? flatItems.findIndex((i) => i.id === lightboxItem.id)
    : -1;

  const navigatePrev =
    currentIndex > 0 ? () => showItem(flatItems[currentIndex - 1]) : undefined;

  const navigateNext =
    currentIndex >= 0 && currentIndex < flatItems.length - 1
      ? () => showItem(flatItems[currentIndex + 1])
      : undefined;

  return {
    lightboxOpen,
    lightboxItem,
    handleGalleryItemClick,
    closeLightbox,
    navigatePrev,
    navigateNext,
  };
}
