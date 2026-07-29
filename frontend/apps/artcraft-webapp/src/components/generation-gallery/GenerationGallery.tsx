import { useEffect, useMemo } from "react";
import { useGallerySelectionStore } from "@storyteller/ui-generation-list";
import { useGalleryViewStore } from "../../lib/gallery-view-store";
import { GenerationGalleryGrid } from "./GenerationGalleryGrid";
import { GenerationGalleryList } from "./GenerationGalleryList";
import { GallerySelectionDownloadBar } from "./GallerySelectionDownloadBar";
import type { GenerationGalleryProps } from "./types";

// Renders the generation feed in whichever layout the user picked via the
// TopBar toggle (persisted in useGalleryViewStore). Drop-in replacement for
// rendering the grid directly on the create pages.
export function GenerationGallery(props: GenerationGalleryProps) {
  const viewMode = useGalleryViewStore((s) => s.viewMode);
  const { selectable, selectionBarBottomOffset, newlyCompletedItems, galleryItems } =
    props;

  // The selection store is global (like the view-mode store) — drop select
  // mode when the feed unmounts so it can't leak onto other pages.
  useEffect(() => {
    if (!selectable) return;
    return () => useGallerySelectionStore.getState().setActive(false);
  }, [selectable]);

  const allItems = useMemo(
    () => [...newlyCompletedItems, ...galleryItems],
    [newlyCompletedItems, galleryItems],
  );

  return (
    <>
      {viewMode === "list" ? (
        <GenerationGalleryList {...props} />
      ) : (
        <GenerationGalleryGrid {...props} />
      )}
      {selectable && (
        <GallerySelectionDownloadBar
          allItems={allItems}
          bottomOffset={selectionBarBottomOffset}
        />
      )}
    </>
  );
}
