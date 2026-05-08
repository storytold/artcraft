import { memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { getModelCreatorIconPath } from "../../lib/omni-gen-hooks";

export interface PendingCardProps {
  id: string;
  modelId: string;
  modelLabel: string;
  prompt: string;
  progress?: number;
  estimatedTimeLeftMs?: number;
  batchCount?: number;
}

const formatTimeLeft = (ms: number): string => {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0 && minutes > 0) return `~${hours}h ${minutes}m`;
  if (hours > 0) return `~${hours}h`;
  if (minutes > 0) return `~${minutes}m`;
  return `~${seconds}s`;
};

export const PendingCard = memo(function PendingCard({
  modelId,
  modelLabel,
  prompt,
  progress,
  estimatedTimeLeftMs,
  batchCount,
}: PendingCardProps) {
  const progressPercent =
    progress != null ? Math.max(0, Math.min(100, Math.round(progress))) : null;
  const isAlmostDone = progress != null && progress >= 95;
  const timeLabel = isAlmostDone
    ? "Almost done..."
    : estimatedTimeLeftMs != null && estimatedTimeLeftMs > 0
      ? formatTimeLeft(estimatedTimeLeftMs)
      : null;

  const iconPath = getModelCreatorIconPath(modelId);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white/[0.03]">
      <div className="animate-shimmer h-full w-full" />
      {batchCount != null && batchCount > 1 && (
        <div className="absolute left-2 right-2 top-2 z-10 rounded-md bg-black/60 px-2.5 py-1.5 text-center text-[10px] leading-snug text-white/70 backdrop-blur-sm">
          Generating {batchCount} videos · Results may appear one at a time
        </div>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <FontAwesomeIcon
          icon={faSpinnerThird}
          className="animate-spin text-2xl text-white/20"
        />
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
        <p className="line-clamp-3 text-xs leading-relaxed text-white/80">
          {prompt}
        </p>
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
