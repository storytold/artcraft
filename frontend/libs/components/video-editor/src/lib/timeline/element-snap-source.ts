import type { SceneTracks } from "./types";
import type { SnapPoint } from "./snapping";
import { addMediaTime } from "../wasm";

// Emits start/end snap points for every clip on every track, so the
// scrub gesture can snap the playhead to clip edges. Optional
// `excludeElementIds` filters out the elements that are currently being
// dragged (you don't want a clip to snap to its own edges).
export function getElementEdgeSnapPoints({
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

      snapPoints.push(
        {
          time: element.startTime,
          type: "element-start",
          elementId: element.id,
          trackId: track.id,
        },
        {
          time: addMediaTime({ a: element.startTime, b: element.duration }),
          type: "element-end",
          elementId: element.id,
          trackId: track.id,
        },
      );
    }
  }

  return snapPoints;
}
