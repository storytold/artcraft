import { useGalleryViewStore } from "../../lib/gallery-view-store";
import { GenerationGalleryGrid } from "./GenerationGalleryGrid";
import { GenerationGalleryList } from "./GenerationGalleryList";
import type { GenerationGalleryProps } from "./types";

// Renders the generation feed in whichever layout the user picked via the
// TopBar toggle (persisted in useGalleryViewStore). Drop-in replacement for
// rendering the grid directly on the create pages.
export function GenerationGallery(props: GenerationGalleryProps) {
  const viewMode = useGalleryViewStore((s) => s.viewMode);
  return viewMode === "list" ? (
    <GenerationGalleryList {...props} />
  ) : (
    <GenerationGalleryGrid {...props} />
  );
}
