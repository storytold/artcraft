// Progress + time-left derivation shared by the pending card and pending row.

export interface PendingStatus {
  progressPercent: number | null;
  timeLabel: string | null;
}

export function derivePendingStatus(
  progress?: number,
  estimatedTimeLeftMs?: number,
): PendingStatus {
  const progressPercent =
    progress != null ? Math.max(0, Math.min(100, Math.round(progress))) : null;
  const isAlmostDone = progress != null && progress >= 95;
  const timeLabel = isAlmostDone
    ? "Almost done..."
    : estimatedTimeLeftMs != null && estimatedTimeLeftMs > 0
      ? formatTimeLeft(estimatedTimeLeftMs)
      : null;
  return { progressPercent, timeLabel };
}

function formatTimeLeft(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0 && minutes > 0) return `~${hours}h ${minutes}m`;
  if (hours > 0) return `~${hours}h`;
  if (minutes > 0) return `~${minutes}m`;
  return `~${seconds}s`;
}
