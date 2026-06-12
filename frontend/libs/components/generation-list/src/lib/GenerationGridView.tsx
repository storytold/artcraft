import type { ReactNode } from "react";
import Masonry from "react-masonry-css";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { PendingCard } from "./PendingCard";
import { FailedCard } from "./FailedCard";
import { GalleryCard } from "./GalleryCard";
import {
  useMergedGalleryEntries,
  useInfiniteScrollSentinel,
} from "./useGalleryEntries";
import type { RecreateSlotContext } from "./GenerationListView";
import type { FailedJob, GalleryItem, InProgressJob } from "./types";

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

export interface GenerationGridViewProps {
  inProgressJobs: InProgressJob[];
  failedJobs: FailedJob[];
  onDismissFailed: (jobToken: string) => void;
  newlyCompletedItems: GalleryItem[];
  galleryItems: GalleryItem[];
  newlyCompletedTokens: Set<string>;
  hasMore: boolean;
  isLoading?: boolean;
  isInitialLoading: boolean;
  onLoadMore: () => void;
  onGalleryItemClick: (item: GalleryItem) => void;
  /** Per-card "Recreate" affordance for pending/failed cards. */
  renderRecreate?: (ctx: RecreateSlotContext) => ReactNode;
  /** Per-card hover quick-action cluster for completed cards. */
  renderGalleryActions?: (
    item: GalleryItem,
    ctx: { modelId?: string; promptToken?: string },
  ) => ReactNode;
}

export function GenerationGridView({
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
  renderRecreate,
  renderGalleryActions,
}: GenerationGridViewProps) {
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
                mediaClass={entry.job.mediaClass}
                recreateSlot={
                  entry.job.promptToken && renderRecreate
                    ? renderRecreate({
                        promptToken: entry.job.promptToken,
                        mediaClass: entry.job.mediaClass,
                        kind: "pending",
                      })
                    : undefined
                }
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
                recreateSlot={
                  entry.job.promptToken && renderRecreate
                    ? renderRecreate({
                        promptToken: entry.job.promptToken,
                        mediaClass: entry.job.mediaClass,
                        kind: "failed",
                      })
                    : undefined
                }
                onDismiss={onDismissFailed}
              />
            )}
            {entry.kind === "gallery" && (
              <GalleryCard
                item={entry.item}
                onClick={onGalleryItemClick}
                actionsSlot={renderGalleryActions?.(entry.item, {
                  modelId: entry.item.modelId,
                  promptToken: entry.item.promptToken,
                })}
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
