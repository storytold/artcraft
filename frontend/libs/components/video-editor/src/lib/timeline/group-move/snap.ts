import type { SceneTracks } from "../types";
import {
  buildTimelineSnapPoints,
  getTimelineSnapThresholdInTicks,
  resolveTimelineSnap,
  type SnapPoint,
} from "../snapping";
import { getElementEdgeSnapPoints } from "../element-snap-source";
import { getPlayheadSnapPoints } from "../playhead-snap-source";
import { getAnimationKeyframeSnapPointsForTimeline } from "../animation-snap-points";
import type { MoveGroup } from "./types";
import { addMediaTime, type MediaTime, subMediaTime } from "../../wasm";

// Group-edge snapping. For each member, considers both the start edge
// (memberStartTime) and the end edge (memberStartTime + duration) as
// snap candidates against the global snap points. Whichever member
// edge lands closest to a snap point wins and back-solves the anchor
// position. Group's own member elements are excluded from snap targets
// so dragging doesn't snap to itself.
export function snapGroupEdges({
  group,
  anchorStartTime,
  tracks,
  playheadTime,
  zoomLevel,
}: {
  group: MoveGroup;
  anchorStartTime: MediaTime;
  tracks: SceneTracks;
  playheadTime: MediaTime;
  zoomLevel: number;
}): {
  snappedAnchorStartTime: MediaTime;
  snapPoint: SnapPoint | null;
} {
  const excludeElementIds = new Set(
    group.members.map((member) => member.elementId),
  );
  const snapPoints = buildTimelineSnapPoints({
    sources: [
      () => getElementEdgeSnapPoints({ tracks, excludeElementIds }),
      () => getPlayheadSnapPoints({ playheadTime }),
      () =>
        getAnimationKeyframeSnapPointsForTimeline({
          tracks,
          excludeElementIds,
        }),
    ],
  });
  const maxSnapDistance = getTimelineSnapThresholdInTicks({ zoomLevel });

  let closestSnapDistance = Infinity;
  let snappedAnchorStartTime = anchorStartTime;
  let snapPoint: SnapPoint | null = null;

  for (const member of group.members) {
    const memberStartTime = addMediaTime({
      a: anchorStartTime,
      b: member.timeOffset,
    });
    const memberStartSnap = resolveTimelineSnap({
      targetTime: memberStartTime,
      snapPoints,
      maxSnapDistance,
    });
    if (
      memberStartSnap.snapPoint &&
      memberStartSnap.snapDistance < closestSnapDistance
    ) {
      closestSnapDistance = memberStartSnap.snapDistance;
      snappedAnchorStartTime = subMediaTime({
        a: memberStartSnap.snappedTime,
        b: member.timeOffset,
      });
      snapPoint = memberStartSnap.snapPoint;
    }

    const memberEndSnap = resolveTimelineSnap({
      targetTime: addMediaTime({
        a: memberStartTime,
        b: member.duration,
      }),
      snapPoints,
      maxSnapDistance,
    });
    if (
      memberEndSnap.snapPoint &&
      memberEndSnap.snapDistance < closestSnapDistance
    ) {
      closestSnapDistance = memberEndSnap.snapDistance;
      snappedAnchorStartTime = subMediaTime({
        a: subMediaTime({
          a: memberEndSnap.snappedTime,
          b: member.duration,
        }),
        b: member.timeOffset,
      });
      snapPoint = memberEndSnap.snapPoint;
    }
  }

  return {
    snappedAnchorStartTime,
    snapPoint,
  };
}
