import type { TimelineElement } from "../types";
import type { PlacementTimeSpan } from "./types";

interface TrackWithElements {
  elements: TimelineElement[];
}

function wouldElementOverlap({
  elements,
  startTime,
  endTime,
  excludeElementId,
}: {
  elements: TimelineElement[];
  startTime: number;
  endTime: number;
  excludeElementId?: string;
}): boolean {
  return elements.some((element) => {
    if (excludeElementId && element.id === excludeElementId) {
      return false;
    }

    const elementEnd = element.startTime + element.duration;
    return startTime < elementEnd && endTime > element.startTime;
  });
}

// True iff every requested time span fits without overlapping an
// existing element on the track. excludeElementId opts an element out
// of the check — used when an element is being dragged within its
// own track and would otherwise overlap with itself.
export function canPlaceTimeSpansOnTrack({
  track,
  timeSpans,
}: {
  track: TrackWithElements;
  timeSpans: PlacementTimeSpan[];
}): boolean {
  return timeSpans.every(({ startTime, duration, excludeElementId }) => {
    return !wouldElementOverlap({
      elements: track.elements,
      startTime,
      endTime: startTime + duration,
      excludeElementId,
    });
  });
}
