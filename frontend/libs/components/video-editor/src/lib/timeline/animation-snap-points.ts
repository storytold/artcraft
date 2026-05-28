import type { SceneTracks } from "./types";
import type { SnapPoint } from "./snapping";

// PHASE-1 STUB: returns no keyframe snap points.
//
// The full OpenCut implementation iterates every element's animation
// channels via `getElementKeyframes` from @/animation/keyframe-query.
// That function chains into channel-data, interpolation, and path
// modules that aren't yet ported. Restoring keyframe snapping requires:
//   1. animation/keyframe-query, /channel-data, /interpolation, /path
//   2. swap this body for the original implementation (visible in
//      opencut-classic/apps/web/src/timeline/animation-snap-points.ts)
//
// Until then the playhead still snaps to element edges, bookmarks, and
// the playhead's own frame grid via the other sources — only the
// element-internal keyframes are missing as snap targets.

export function getAnimationKeyframeSnapPointsForTimeline(_args: {
  tracks: SceneTracks;
  excludeElementIds?: Set<string>;
}): SnapPoint[] {
  return [];
}
