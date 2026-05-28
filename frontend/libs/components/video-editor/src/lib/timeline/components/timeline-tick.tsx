"use client";

import type { FrameRate } from "opencut-wasm";
import { timelineTimeToSnappedPixels } from "../pixel-utils";
import { formatRulerLabel } from "../ruler-utils";

interface TimelineTickProps {
  time: number;
  timeInSeconds: number;
  zoomLevel: number;
  fps: FrameRate;
  showLabel: boolean;
}

export function TimelineTick({
  time,
  timeInSeconds,
  zoomLevel,
  fps,
  showLabel,
}: TimelineTickProps) {
  const leftPosition = timelineTimeToSnappedPixels({ time, zoomLevel });

  if (showLabel) {
    const label = formatRulerLabel({ timeInSeconds, fps });
    return (
      <span
        className="text-muted-foreground/85 absolute top-1 select-none text-[10px] leading-none"
        style={{ left: `${leftPosition}px` }}
      >
        {label}
      </span>
    );
  }

  return (
    <div
      className="border-muted-foreground/25 absolute top-1.5 h-1.5 border-l"
      style={{ left: `${leftPosition}px` }}
    />
  );
}
