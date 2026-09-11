import { BASE_TIMELINE_PIXELS_PER_SECOND } from "../scale";
import { TICKS_PER_SECOND } from "../../wasm";

const DEFAULT_TIMELINE_SNAP_THRESHOLD_PX = 10;

// Converts a screen-space snap radius (px) into ticks. Snap thresholds
// scale with zoom so users get the same "felt distance" regardless of
// how zoomed in/out the timeline is.
export function getTimelineSnapThresholdInTicks({
  zoomLevel,
  snapThresholdPx = DEFAULT_TIMELINE_SNAP_THRESHOLD_PX,
}: {
  zoomLevel: number;
  snapThresholdPx?: number;
}): number {
  const pixelsPerSecond = BASE_TIMELINE_PIXELS_PER_SECOND * zoomLevel;
  return (snapThresholdPx / pixelsPerSecond) * TICKS_PER_SECOND;
}
