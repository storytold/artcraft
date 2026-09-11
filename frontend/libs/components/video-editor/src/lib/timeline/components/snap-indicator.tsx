"use client";

import { useSnapIndicatorPosition } from "../hooks/use-snap-indicator-position";
import type { SnapPoint } from "../snapping";
import {
  getCenteredLineLeft,
  TIMELINE_INDICATOR_LINE_WIDTH_PX,
} from "../pixel-utils";
import { TIMELINE_LAYERS } from "./layers";
interface SnapIndicatorProps {
  snapPoint: SnapPoint | null;
  zoomLevel: number;
  isVisible: boolean;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  tracksScrollRef: React.RefObject<HTMLDivElement | null>;
}

export function SnapIndicator({
  snapPoint,
  zoomLevel,
  isVisible,
  timelineRef,
  tracksScrollRef,
}: SnapIndicatorProps) {
  const { leftPosition, topPosition, height } = useSnapIndicatorPosition({
    snapPoint,
    zoomLevel,
    timelineRef,
    tracksScrollRef,
  });

  if (!isVisible || !snapPoint) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: `${getCenteredLineLeft({ centerPixel: leftPosition })}px`,
        top: topPosition,
        height: `${height}px`,
        width: `${TIMELINE_INDICATOR_LINE_WIDTH_PX}px`,
        zIndex: TIMELINE_LAYERS.snapIndicator,
      }}
    >
      <div className={"bg-primary/40 h-full w-0.5 opacity-80"} />
    </div>
  );
}
