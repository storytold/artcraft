import type { SnapPoint, TimelineSnapPointSource } from "./types";

export function buildTimelineSnapPoints({
  sources,
}: {
  sources: TimelineSnapPointSource[];
}): SnapPoint[] {
  const snapPoints: SnapPoint[] = [];

  for (const source of sources) {
    for (const snapPoint of source()) {
      snapPoints.push(snapPoint);
    }
  }

  return snapPoints;
}
