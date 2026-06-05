import Masonry from "react-masonry-css";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { PendingCard } from "./PendingCard";
import { FailedCard } from "./FailedCard";
import { GalleryCard } from "./GalleryCard";
import {
  useMergedGalleryEntries,
  useInfiniteScrollSentinel,
} from "./useGalleryEntries";
import type { GenerationGalleryProps } from "./types";

// ── Grid layout constants ─────────────────────────────────────────────────

const BREAKPOINT_COLS = {
  default: 4,
  1280: 4,
  900: 3,
  640: 2,
};

// 12px gap on both axes (≈ Tailwind gap-3).
// ml-[-12px] on container offsets the first column's pl-[8px].
const MASONRY_CLASS = "flex w-auto ml-[-12px]";
const COLUMN_CLASS = "pl-[8px]";

// ── Component ──────────────────────────────────────────────────────────────

export function GenerationGalleryGrid({
  inProgressJobs,
  failedJobs,
  onDismissFailed,
  newlyCompletedItems,
  galleryItems,
  newlyCompletedTokens,
  hasMore,
  isInitialLoading,
  onLoadMore,
  onGalleryItemClick,
  enableMakeVideo,
}: GenerationGalleryProps) {
  const sentinelRef = useInfiniteScrollSentinel(hasMore, onLoadMore);

  const mergedEntries = useMergedGalleryEntries({
    inProgressJobs,
    failedJobs,
    newlyCompletedItems,
    galleryItems,
    newlyCompletedTokens,
  });

  if (isInitialLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-6 w-6 text-white/60" />
      </div>
    );
  }

  return (
    <>
      <Masonry
        breakpointCols={BREAKPOINT_COLS}
        className={MASONRY_CLASS}
        columnClassName={COLUMN_CLASS}
      >
        {mergedEntries.map((entry) => (
          <div key={entry.key} className="mb-[8px]">
            {entry.kind === "pending" && (
              <PendingCard
                id={entry.job.id}
                prompt={entry.job.prompt}
                modelId={entry.job.modelId}
                modelLabel={entry.job.modelLabel}
                progress={entry.job.progress}
                estimatedTimeLeftMs={entry.job.estimatedTimeLeftMs}
                batchCount={entry.job.batchCount}
              />
            )}
            {entry.kind === "failed" && (
              <FailedCard
                id={entry.job.id}
                prompt={entry.job.prompt}
                modelId={entry.job.modelId}
                modelLabel={entry.job.modelLabel}
                failureReason={entry.job.failureReason}
                failureMessage={entry.job.failureMessage}
                refImageUrl={entry.job.refImageUrl}
                promptToken={entry.job.promptToken}
                recreateMediaClass={entry.job.mediaClass}
                onDismiss={onDismissFailed}
              />
            )}
            {entry.kind === "gallery" && (
              <GalleryCard
                item={entry.item}
                onClick={onGalleryItemClick}
                enableMakeVideo={enableMakeVideo}
              />
            )}
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
