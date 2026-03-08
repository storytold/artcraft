import { SNAP_THRESHOLD_PX, PIXELS_PER_SECOND } from "../../constants/timeline";
import type { TimelineTrack } from "../../types";

export interface SnapPoint {
  time: number;
  type: "element-start" | "element-end" | "playhead";
}

export function findSnapPoints(
  tracks: TimelineTrack[],
  playheadTime: number,
  excludeElementId?: string,
): SnapPoint[] {
  const points: SnapPoint[] = [{ time: playheadTime, type: "playhead" }];

  for (const track of tracks) {
    for (const el of track.elements) {
      if (excludeElementId && el.id === excludeElementId) continue;
      points.push({ time: el.startTime, type: "element-start" });
      points.push({
        time: el.startTime + el.duration,
        type: "element-end",
      });
    }
  }

  return points;
}

export function snapToNearestPoint(
  targetTime: number,
  snapPoints: SnapPoint[],
  zoomLevel: number,
): { snappedTime: number; snapPoint: SnapPoint | null } {
  const threshold = SNAP_THRESHOLD_PX / (PIXELS_PER_SECOND * zoomLevel);
  let closest: SnapPoint | null = null;
  let closestDist = Infinity;

  for (const point of snapPoints) {
    const dist = Math.abs(targetTime - point.time);
    if (dist < closestDist && dist <= threshold) {
      closest = point;
      closestDist = dist;
    }
  }

  return closest
    ? { snappedTime: closest.time, snapPoint: closest }
    : { snappedTime: targetTime, snapPoint: null };
}
