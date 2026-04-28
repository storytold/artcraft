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
  default: 4,
  1280: 4,
  900: 3,
  640: 2,
};

// 12px gap on both axes (≈ Tailwind gap-3).
// ml-[-12px] on container offsets the first column's pl-[8px].
const MASONRY_CLASS = "flex w-auto ml-[-12px]";
const COLUMN_CLASS = "pl-[8px]";

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
  isInitialLoading: boolean;
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
  isInitialLoading,
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

  const mergedEntries = useMemo(() => {
    type Entry =
      | { kind: "pending"; key: string; createdAt: number; job: InProgressJob }
      | { kind: "failed"; key: string; createdAt: number; job: FailedJob }
      | {
          kind: "gallery";
          key: string;
          createdAt: number;
          item: GalleryItem;
        };

    const entries: Entry[] = [];

    for (const job of inProgressJobs) {
      entries.push({
        kind: "pending",
        key: job.id,
        createdAt: new Date(job.createdAt).getTime(),
        job,
      });
    }
    for (const job of failedJobs) {
      entries.push({
        kind: "failed",
        key: job.id,
        createdAt: new Date(job.createdAt).getTime(),
        job,
      });
    }
    for (const item of newlyCompletedItems) {
      entries.push({
        kind: "gallery",
        key: `new-${item.id}`,
        createdAt: new Date(item.createdAt).getTime(),
        item,
      });
    }
    for (const item of galleryItems) {
      if (newlyCompletedTokens.has(item.id)) continue;
      entries.push({
        kind: "gallery",
        key: item.id,
        createdAt: new Date(item.createdAt).getTime(),
        item,
      });
    }

    entries.sort((a, b) => b.createdAt - a.createdAt);
    return entries;
  }, [inProgressJobs, failedJobs, newlyCompletedItems, galleryItems, newlyCompletedTokens]);

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
              />
            )}
            {entry.kind === "failed" && (
              <FailedCard
                id={entry.job.id}
                prompt={entry.job.prompt}
                modelLabel={entry.job.modelLabel}
                failureReason={entry.job.failureReason}
                failureMessage={entry.job.failureMessage}
                onDismiss={onDismissFailed}
              />
            )}
            {entry.kind === "gallery" && (
              <GalleryCard item={entry.item} onClick={onGalleryItemClick} />
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
