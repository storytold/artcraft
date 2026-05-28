import type { MediaTime } from "../../wasm";

export type SnapPointType =
  | "element-start"
  | "element-end"
  | "playhead"
  | "bookmark"
  | "keyframe";

export interface SnapPoint {
  time: MediaTime;
  type: SnapPointType;
  elementId?: string;
  trackId?: string;
}

export interface SnapResult {
  snappedTime: MediaTime;
  snapPoint: SnapPoint | null;
  snapDistance: number;
}

// Producers register a source (closure over track elements, bookmarks,
// keyframes, etc.) and the timeline materializes the union of their
// emitted points on each scrub frame.
export type TimelineSnapPointSource = () => Iterable<SnapPoint>;
