// Bridge for "drag an item from the gallery/library onto the board". The host
// app owns the gallery (and its drag source), so it can't reach into this lib's
// views directly. Instead the app calls this on its gallery drop callback; the
// grid + canvas views listen for the dispatched event. Keeping the dispatch
// here (rather than in the app) means the event name + payload shape stay
// owned by the lib that consumes them.

export interface DroppedGalleryItem {
  id?: string;
  thumbnail?: string | null;
  fullImage?: string | null;
}

export const GALLERY_MOODBOARD_DROP_EVENT = "gallery-moodboard-drop";

// Dispatches a board-drop for `item` if `screenPosition` (viewport coords) lands
// over the mounted moodboard surface. Returns whether it was accepted, so the
// caller can fall back to its own handling when the drop missed the board.
export const dispatchGalleryMoodboardDrop = (
  item: DroppedGalleryItem,
  screenPosition: { x: number; y: number },
): boolean => {
  const root = document.querySelector("[data-moodboard-root]");
  if (!root) return false;
  const rect = root.getBoundingClientRect();
  if (
    screenPosition.x < rect.left ||
    screenPosition.x > rect.right ||
    screenPosition.y < rect.top ||
    screenPosition.y > rect.bottom
  ) {
    return false;
  }
  window.dispatchEvent(
    new CustomEvent(GALLERY_MOODBOARD_DROP_EVENT, {
      detail: {
        item,
        canvasPosition: {
          x: screenPosition.x - rect.left,
          y: screenPosition.y - rect.top,
        },
      },
    }),
  );
  return true;
};
