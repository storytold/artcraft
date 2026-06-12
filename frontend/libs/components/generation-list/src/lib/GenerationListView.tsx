import { useCallback, useMemo, type ReactNode } from "react";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { PendingRow } from "./PendingRow";
import { FailedRow } from "./FailedRow";
import { GalleryRow } from "./GalleryRow";
import {
  useMergedGalleryEntries,
  useInfiniteScrollSentinel,
} from "./useGalleryEntries";
import { usePrompts } from "./prompts-cache";
import { useMediaPromptTokens } from "./media-prompt-token-cache";
import type { FailedJob, GalleryItem, InProgressJob } from "./types";

// Constrains the feed to the promptbox width (max-w-5xl) and stacks one row
// per generation: a single time-sorted merge of the in-progress / failed /
// completed streams. Host-specific affordances (recreate, share/download,
// toasts) are injected through the render-prop seams so the webapp and the
// desktop app can share this view verbatim.

export interface RecreateSlotContext {
  promptToken: string;
  mediaClass: "image" | "video";
  kind: "pending" | "failed";
}

export interface GenerationListViewProps {
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
  /** Per-row "Recreate" affordance for pending/failed rows. */
  renderRecreate?: (ctx: RecreateSlotContext) => ReactNode;
  /** Per-row hover quick-action cluster for completed rows. `modelId` and
   *  `promptToken` come from the prompt record resolved by the list (richer
   *  than the media file's own fields). */
  renderGalleryActions?: (
    item: GalleryItem,
    ctx: { modelId?: string; promptToken?: string },
  ) => ReactNode;
  /** Copy-prompt feedback (e.g. host toast). */
  onCopyPromptResult?: (success: boolean) => void;
}

export function GenerationListView({
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
  onCopyPromptResult,
}: GenerationListViewProps) {
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
                onCopyPromptResult={onCopyPromptResult}
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
                onCopyPromptResult={onCopyPromptResult}
              />
            );
          }
          const { promptToken, resolved } = promptStateFor(entry.item);
          const prompt = promptToken ? promptsMap.get(promptToken) : undefined;
          // Loading while the media→prompt lookup is pending, or it found a
          // prompt token whose text hasn't arrived yet.
          const loading = !resolved || (!!promptToken && !prompt);
          const modelId = prompt?.maybe_model_type || undefined;
          return (
            <GalleryRow
              key={entry.key}
              item={entry.item}
              onClick={onGalleryItemClick}
              title={prompt?.maybe_positive_prompt?.trim() || undefined}
              modelId={modelId}
              loading={loading}
              actionsSlot={renderGalleryActions?.(entry.item, {
                modelId,
                promptToken: promptToken || undefined,
              })}
              onCopyPromptResult={onCopyPromptResult}
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
