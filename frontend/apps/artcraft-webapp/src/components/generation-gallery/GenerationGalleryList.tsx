import { useCallback, useMemo } from "react";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { PendingRow } from "./PendingRow";
import { FailedRow } from "./FailedRow";
import { GalleryRow } from "./GalleryRow";
import {
  useMergedGalleryEntries,
  useInfiniteScrollSentinel,
} from "./useGalleryEntries";
import { usePrompts } from "../../lib/prompts-cache";
import { useMediaPromptTokens } from "../../lib/media-prompt-token-cache";
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

  // Show the real prompt text + model on completed rows instead of the
  // "Image Generation" placeholder. The profile media-list endpoint doesn't
  // return prompt tokens yet, so for items missing one we resolve it through
  // the batch media-files endpoint (media token → prompt token), then feed the
  // prompt token into the prompts cache (prompt token → text + model). Both
  // steps are batched + cached. Pending/failed entries already carry a prompt.
  const mediaTokensNeedingPrompt = useMemo(
    () =>
      mergedEntries.flatMap((entry) =>
        entry.kind === "gallery" && !entry.item.promptToken
          ? [entry.item.id]
          : [],
      ),
    [mergedEntries],
  );
  const resolvedPromptTokens = useMediaPromptTokens(mediaTokensNeedingPrompt);

  // For an item: its (non-empty) prompt token, and whether the media→prompt
  // lookup has finished. `resolved` lets rows show a skeleton while loading and
  // fall back to the label once we know there's no prompt.
  const promptStateFor = useCallback(
    (item: { id: string; promptToken?: string }) => {
      const direct = item.promptToken;
      const resolved = direct != null || resolvedPromptTokens.has(item.id);
      const promptToken = direct || resolvedPromptTokens.get(item.id) || "";
      return { promptToken, resolved };
    },
    [resolvedPromptTokens],
  );

  const promptTokens = useMemo(() => {
    const tokens: string[] = [];
    for (const entry of mergedEntries) {
      if (entry.kind !== "gallery") continue;
      const { promptToken } = promptStateFor(entry.item);
      if (promptToken) tokens.push(promptToken);
    }
    return tokens;
  }, [mergedEntries, promptStateFor]);
  const promptsMap = usePrompts(promptTokens);

  if (isInitialLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-6 w-6 text-white/60" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl sm:px-4">
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
                refImageUrl={entry.job.refImageUrl}
                promptToken={entry.job.promptToken}
                recreateMediaClass={entry.job.mediaClass}
                onDismiss={onDismissFailed}
              />
            );
          }
          const { promptToken, resolved } = promptStateFor(entry.item);
          const prompt = promptToken ? promptsMap.get(promptToken) : undefined;
          // Loading while the media→prompt lookup is pending, or it found a
          // prompt token whose text hasn't arrived yet.
          const loading = !resolved || (!!promptToken && !prompt);
          return (
            <GalleryRow
              key={entry.key}
              item={entry.item}
              onClick={onGalleryItemClick}
              enableMakeVideo={enableMakeVideo}
              title={prompt?.maybe_positive_prompt?.trim() || undefined}
              modelId={prompt?.maybe_model_type || undefined}
              loading={loading}
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
