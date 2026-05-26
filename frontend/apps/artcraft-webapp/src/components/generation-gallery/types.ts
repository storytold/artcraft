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
}
