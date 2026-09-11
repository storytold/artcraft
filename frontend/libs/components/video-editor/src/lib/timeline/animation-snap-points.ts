import { getElementKeyframes } from "../animation";
import type { SceneTracks } from "./types";
import type { SnapPoint } from "./snapping";
import { addMediaTime } from "../wasm";

// Emits snap points for every keyframe on every animatable element in
// the scene tracks. Used by the playhead scrubber so the cursor snaps
// to keyframes during scrub.
//
// (Previously a phase-1 stub returning []. Now the real implementation
// since the animation chain has been ported in full.)
export function getAnimationKeyframeSnapPointsForTimeline({
  tracks,
  excludeElementIds,
}: {
  tracks: SceneTracks;
  excludeElementIds?: Set<string>;
}): SnapPoint[] {
  const snapPoints: SnapPoint[] = [];
  const orderedTracks = [...tracks.overlay, tracks.main, ...tracks.audio];

  for (const track of orderedTracks) {
    for (const element of track.elements) {
      if (excludeElementIds?.has(element.id)) {
        continue;
      }

      for (const keyframe of getElementKeyframes({
        animations: element.animations,
      })) {
        snapPoints.push({
          time: addMediaTime({ a: element.startTime, b: keyframe.time }),
          type: "keyframe",
          elementId: element.id,
          trackId: track.id,
        });
      }
    }
  }

  return snapPoints;
}
