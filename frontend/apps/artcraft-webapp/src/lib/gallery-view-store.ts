// Moved to the shared generation-list lib (used by both webapp and desktop).
// Re-exported so every webapp consumer shares the lib's store instance.
export {
  useGalleryViewStore,
  type GalleryViewMode,
} from "@storyteller/ui-generation-list";
