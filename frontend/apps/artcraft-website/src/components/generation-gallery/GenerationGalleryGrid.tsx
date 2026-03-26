import { useEffect, useMemo, useRef } from "react";
import Masonry from "react-masonry-css";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { PendingCard } from "./PendingCard";
import { FailedCard } from "./FailedCard";
import { GalleryCard } from "./GalleryCard";
import type { InProgressJob, FailedJob } from "./useGenerationJobs";
import type { GalleryItem } from "./useGalleryData";

// ── Grid layout constants ─────────────────────────────────────────────────

const BREAKPOINT_COLS = {
  default: 5,
  1536: 4,
  1280: 4,
  900: 3,
  640: 2,
};

// Gap via negative margin on container + padding on columns.
// Item spacing via margin-bottom on each child wrapper.
const MASONRY_CLASS = "flex w-auto -ml-1";
const COLUMN_CLASS = "pl-1 bg-clip-padding";

// ── Types ──────────────────────────────────────────────────────────────────

interface GenerationGalleryGridProps {
  inProgressJobs: InProgressJob[];
  failedJobs: FailedJob[];
  onDismissFailed: (jobToken: string) => void;
  newlyCompletedItems: GalleryItem[];
  galleryItems: GalleryItem[];
  newlyCompletedTokens: Set<string>;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onGalleryItemClick: (item: GalleryItem) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function GenerationGalleryGrid({
  inProgressJobs,
  failedJobs,
  onDismissFailed,
  newlyCompletedItems,
  galleryItems,
  newlyCompletedTokens,
  hasMore,
  isLoading,
  onLoadMore,
  onGalleryItemClick,
}: GenerationGalleryGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore();
      },
      { rootMargin: "400px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  const filteredGalleryItems = useMemo(
    () =>
      newlyCompletedTokens.size > 0
        ? galleryItems.filter((item) => !newlyCompletedTokens.has(item.id))
        : galleryItems,
    [galleryItems, newlyCompletedTokens],
  );

  return (
    <>
      <Masonry
        breakpointCols={BREAKPOINT_COLS}
        className={MASONRY_CLASS}
        columnClassName={COLUMN_CLASS}
      >
        {inProgressJobs.map((job) => (
          <div key={job.id} className="mb-1">
            <PendingCard
              id={job.id}
              prompt={job.prompt}
              modelLabel={job.modelLabel}
              progress={job.progress}
              estimatedTimeLeftMs={job.estimatedTimeLeftMs}
            />
          </div>
        ))}
        {failedJobs.map((job) => (
          <div key={job.id} className="mb-1">
            <FailedCard
              id={job.id}
              prompt={job.prompt}
              modelLabel={job.modelLabel}
              failureReason={job.failureReason}
              failureMessage={job.failureMessage}
              onDismiss={onDismissFailed}
            />
          </div>
        ))}
        {newlyCompletedItems.map((item) => (
          <div key={`new-${item.id}`} className="mb-1">
            <GalleryCard item={item} onClick={onGalleryItemClick} />
          </div>
        ))}
        {filteredGalleryItems.map((item) => (
          <div key={item.id} className="mb-1">
            <GalleryCard item={item} onClick={onGalleryItemClick} />
          </div>
        ))}
      </Masonry>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          <LoadingSpinner className="h-6 w-6 text-white/60" />
        </div>
      )}
    </>
  );
}
