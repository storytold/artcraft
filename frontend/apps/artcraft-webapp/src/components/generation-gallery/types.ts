import type { FailedJob, InProgressJob } from "./useGenerationJobs";
import type { GalleryItem } from "./useGalleryData";

// Props shared by every gallery view (grid, list, and the switching wrapper).
// All three render the same merged feed and differ only in layout.
export interface GenerationGalleryProps {
  inProgressJobs: InProgressJob[];
  failedJobs: FailedJob[];
  onDismissFailed: (jobToken: string) => void;
  newlyCompletedItems: GalleryItem[];
  galleryItems: GalleryItem[];
  newlyCompletedTokens: Set<string>;
  hasMore: boolean;
  isLoading: boolean;
  isInitialLoading: boolean;
  onLoadMore: () => void;
  onGalleryItemClick: (item: GalleryItem) => void;
  enableMakeVideo?: boolean;
  /** Enables the multi-select + batch download flow (select toggle in the
   *  TopBar, checkboxes on completed items, floating download bar). */
  selectable?: boolean;
  /** Pixel offset that keeps the floating download bar above the page's
   *  fixed prompt box (pass the measured promptbox height + gap). */
  selectionBarBottomOffset?: number;
}
