import type { SceneTracks, TimelineElement, VideoTrack } from "../types";
import { type MediaTime, ZERO_MEDIA_TIME } from "../../wasm";

// Main-track placement rules. The main track always starts at time 0 —
// new elements snap to that base, and explicitly setting an
// already-earliest element later in time keeps the rest of the track
// stationary (we don't shift everyone forward).

export const MAIN_TRACK_NAME = "Main Track";

export function getEarliestMainTrackElement({
  mainTrack,
  excludeElementId,
}: {
  mainTrack: VideoTrack;
  excludeElementId?: string;
}): TimelineElement | null {
  const elements = mainTrack.elements.filter((element) => {
    return !excludeElementId || element.id !== excludeElementId;
  });
  if (elements.length === 0) {
    return null;
  }

  return elements.reduce((earliestElement, element) => {
    return element.startTime < earliestElement.startTime
      ? element
      : earliestElement;
  });
}

export function enforceMainTrackStart({
  tracks,
  targetTrackId,
  requestedStartTime,
  excludeElementId,
}: {
  tracks: SceneTracks;
  targetTrackId: string;
  requestedStartTime: MediaTime;
  excludeElementId?: string;
}): MediaTime {
  if (tracks.main.id !== targetTrackId) {
    return requestedStartTime;
  }

  const earliestElement = getEarliestMainTrackElement({
    mainTrack: tracks.main,
    excludeElementId,
  });
  if (!earliestElement) {
    return ZERO_MEDIA_TIME;
  }

  if (requestedStartTime <= earliestElement.startTime) {
    return ZERO_MEDIA_TIME;
  }

  return requestedStartTime;
}
