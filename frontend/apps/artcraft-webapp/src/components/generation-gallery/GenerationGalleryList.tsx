import { useMemo } from "react";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { PendingRow } from "./PendingRow";
import { FailedRow } from "./FailedRow";
import { GalleryRow } from "./GalleryRow";
import {
  useMergedGalleryEntries,
  useInfiniteScrollSentinel,
} from "./useGalleryEntries";
import { usePrompts } from "../../lib/prompts-cache";
import type { GenerationGalleryProps } from "./types";

// Constrains the feed to the promptbox width (max-w-5xl) and stacks one row
// per generation, mirroring the masonry grid's merged in-progress / failed /
// completed feed.

export function GenerationGalleryList({
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

  // Resolve each completed item's prompt record (batched + cached) so rows can
  // show the real prompt text and model rather than the "Image Generation"
  // placeholder. Pending/failed entries already carry their own prompt.
  const promptTokens = useMemo(
    () =>
      mergedEntries.flatMap((entry) =>
        entry.kind === "gallery" && entry.item.promptToken
          ? [entry.item.promptToken]
          : [],
      ),
    [mergedEntries],
  );
  const promptsMap = usePrompts(promptTokens);

  if (isInitialLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-6 w-6 text-white/60" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex flex-col divide-y divide-white/[0.04]">
        {mergedEntries.map((entry) => {
          if (entry.kind === "pending") {
            return (
              <PendingRow
                key={entry.key}
                id={entry.job.id}
                prompt={entry.job.prompt}
                modelId={entry.job.modelId}
                modelLabel={entry.job.modelLabel}
                progress={entry.job.progress}
                estimatedTimeLeftMs={entry.job.estimatedTimeLeftMs}
                batchCount={entry.job.batchCount}
              />
            );
          }
          if (entry.kind === "failed") {
            return (
              <FailedRow
                key={entry.key}
                id={entry.job.id}
                prompt={entry.job.prompt}
                modelId={entry.job.modelId}
                modelLabel={entry.job.modelLabel}
                failureReason={entry.job.failureReason}
                failureMessage={entry.job.failureMessage}
                onDismiss={onDismissFailed}
              />
            );
          }
          const prompt = entry.item.promptToken
            ? promptsMap.get(entry.item.promptToken)
            : undefined;
          return (
            <GalleryRow
              key={entry.key}
              item={entry.item}
              onClick={onGalleryItemClick}
              enableMakeVideo={enableMakeVideo}
              title={prompt?.maybe_positive_prompt?.trim() || undefined}
              modelId={prompt?.maybe_model_type || undefined}
            />
          );
        })}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          <LoadingSpinner className="h-6 w-6 text-white/60" />
        </div>
      )}
    </div>
  );
}
