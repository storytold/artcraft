import type { SnapPoint, SnapResult } from "./types";
import type { MediaTime } from "../../wasm";

// Picks the closest snap point within maxSnapDistance. Ties go to the
// first match in iteration order, so the caller decides priority by
// the order they push points into the array.
export function resolveTimelineSnap({
  targetTime,
  snapPoints,
  maxSnapDistance,
}: {
  targetTime: MediaTime;
  snapPoints: SnapPoint[];
  maxSnapDistance: number;
}): SnapResult {
  let closestSnapPoint: SnapPoint | null = null;
  let closestDistance = Infinity;

  for (const snapPoint of snapPoints) {
    const distance = Math.abs(targetTime - snapPoint.time);
    if (distance <= maxSnapDistance && distance < closestDistance) {
      closestDistance = distance;
      closestSnapPoint = snapPoint;
    }
  }

  return {
    snappedTime: closestSnapPoint ? closestSnapPoint.time : targetTime,
    snapPoint: closestSnapPoint,
    snapDistance: closestDistance,
  };
}
