import { useCallback, useMemo, useState } from "react";
import type { GalleryItem } from "./useGalleryData";

export function useLightboxNav(flatItems: GalleryItem[]) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  const handleGalleryItemClick = useCallback((item: GalleryItem) => {
    setLightboxItem(item);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setLightboxItem(null);
  }, []);

  const currentIndex = lightboxItem
    ? flatItems.findIndex((i) => i.id === lightboxItem.id)
    : -1;

  const navigatePrev =
    currentIndex > 0
      ? () => setLightboxItem(flatItems[currentIndex - 1])
      : undefined;

  const navigateNext =
    currentIndex >= 0 && currentIndex < flatItems.length - 1
      ? () => setLightboxItem(flatItems[currentIndex + 1])
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
