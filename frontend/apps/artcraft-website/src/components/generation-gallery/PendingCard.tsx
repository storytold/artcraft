import { memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";

export interface PendingCardProps {
  id: string;
  modelLabel: string;
  prompt: string;
  progress?: number;
  estimatedTimeLeftMs?: number;
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
  modelLabel,
  prompt,
  progress,
  estimatedTimeLeftMs,
}: PendingCardProps) {
  const progressPercent =
    progress != null ? Math.max(0, Math.min(100, Math.round(progress))) : null;
  const isAlmostDone = progress != null && progress >= 95;
  const timeLabel = isAlmostDone
    ? "Almost done..."
    : estimatedTimeLeftMs != null && estimatedTimeLeftMs > 0
      ? formatTimeLeft(estimatedTimeLeftMs)
      : null;

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white/[0.03]">
      <div className="animate-shimmer h-full w-full" />
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
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2.5 pt-6">
        <p className="truncate text-xs text-white/70">{prompt}</p>
        <div className="mt-1 flex items-center gap-2">
          <p className="truncate text-[10px] text-white/40">{modelLabel}</p>
          {progressPercent != null && (
            <div className="h-1 min-w-0 flex-1 rounded-full bg-white/10">
              <div
                className="h-1 rounded-full bg-primary-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
