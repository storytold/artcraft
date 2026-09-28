import { memo, type ReactNode } from "react";
import { LoaderCircleIcon } from "lucide-react";
import { getCreatorIconPathForModelId } from "@storyteller/model-list";
import { derivePendingStatus } from "./pending-status";
import { batchNoun } from "./types";
import type { GenerationMediaClass } from "./types";

export interface PendingCardProps {
  id: string;
  modelId: string;
  modelLabel: string;
  prompt: string;
  progress?: number;
  estimatedTimeLeftMs?: number;
  batchCount?: number;
  mediaClass: GenerationMediaClass;
  /** Hover-revealed action (e.g. a Recreate button) next to the prompt. */
  recreateSlot?: ReactNode;
}

export const PendingCard = memo(function PendingCard({
  modelId,
  modelLabel,
  prompt,
  progress,
  estimatedTimeLeftMs,
  batchCount,
  mediaClass,
  recreateSlot,
}: PendingCardProps) {
  const { progressPercent, timeLabel } = derivePendingStatus(
    progress,
    estimatedTimeLeftMs,
  );

  const iconPath = getCreatorIconPathForModelId(modelId);

  return (
    <div className="group relative aspect-square w-full overflow-hidden rounded-[3px] bg-white/[0.03]">
      <div className="animate-shimmer h-full w-full" />
      {batchCount != null && batchCount > 1 && (
        <div className="absolute left-2 right-2 top-2 z-10 bg-black/60 px-2.5 py-1.5 text-center text-[10px] leading-snug text-white/70 backdrop-blur-sm">
          Generating {batchCount} {batchNoun(mediaClass)} · Results may appear
          one at a time
        </div>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <LoaderCircleIcon className="animate-spin text-2xl text-white/20" />
        {progressPercent != null && (
          <span className="text-xs tabular-nums text-white/40">
            {progressPercent}%
          </span>
        )}
        {timeLabel && (
          <span className="text-[10px] text-white/30">{timeLabel}</span>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent px-3 pb-2.5 pt-8">
        <div className="flex items-start gap-2">
          <p className="line-clamp-3 min-w-0 flex-1 text-xs leading-relaxed text-white/80">
            {prompt}
          </p>
          {recreateSlot}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <img
            src={iconPath}
            alt=""
            className="h-3.5 w-3.5 flex-shrink-0 icon-auto-contrast"
          />
          <p className="truncate text-[10px] font-medium text-white/50">
            {modelLabel}
          </p>
        </div>
        {progressPercent != null && (
          <div className="mt-1.5 h-1 w-full rounded-full bg-white/10">
            <div
              className="h-1 rounded-full bg-primary-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
});
