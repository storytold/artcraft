import { addMediaTime, type MediaTime, ZERO_MEDIA_TIME } from "../wasm";
import type { SceneTracks } from "./types";

// Project duration = max endTime across all tracks (main + overlays + audio).
// Equal to opencut's `calculateTotalDuration` from timeline/index.ts —
// extracted into its own file here so scenes.ts can import it without
// pulling in the rest of the timeline barrel.
export function calculateTotalDuration({
  tracks,
}: {
  tracks: SceneTracks;
}): MediaTime {
  const orderedTracks = [...tracks.overlay, tracks.main, ...tracks.audio];
  if (orderedTracks.length === 0) return ZERO_MEDIA_TIME;

  let maxEnd: MediaTime = ZERO_MEDIA_TIME;
  for (const track of orderedTracks) {
    for (const element of track.elements) {
      const elementEnd = addMediaTime({
        a: element.startTime,
        b: element.duration,
      });
      if (elementEnd > maxEnd) maxEnd = elementEnd;
    }
  }
  return maxEnd;
}
