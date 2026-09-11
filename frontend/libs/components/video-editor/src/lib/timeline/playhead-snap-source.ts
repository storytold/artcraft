import type { SnapPoint } from "./snapping";
import type { MediaTime } from "../wasm";

// Single playhead snap point so scrubbing/dragging can snap to the
// current playhead position. Trivial in implementation but kept as a
// separate file to keep the snap-source surface uniform with the
// other source files (element-edge, bookmark, animation-keyframe).
export function getPlayheadSnapPoints({
  playheadTime,
}: {
  playheadTime: MediaTime;
}): SnapPoint[] {
  return [{ time: playheadTime, type: "playhead" }];
}
