import { TRACK_CONFIG, TRACK_GAP } from "../../constants/timeline";
import type {
  TrackType,
  TimelineTrack,
  ElementType,
} from "../../types";

export function getTrackHeight(type: TrackType): number {
  return TRACK_CONFIG[type].height;
}

export function getCumulativeHeight(
  tracks: TimelineTrack[],
  upToIndex: number,
): number {
  let total = 0;
  for (let i = 0; i < upToIndex && i < tracks.length; i++) {
    total += getTrackHeight(tracks[i].type) + TRACK_GAP;
  }
  return total;
}

export function getTotalTracksHeight(tracks: TimelineTrack[]): number {
  return tracks.reduce(
    (sum, track) => sum + getTrackHeight(track.type) + TRACK_GAP,
    0,
  );
}

export function canElementGoOnTrack(
  elementType: ElementType,
  trackType: TrackType,
): boolean {
  switch (trackType) {
    case "video":
      return elementType === "video" || elementType === "image";
    case "audio":
      return elementType === "audio";
    case "text":
      return elementType === "text";
    default:
      return false;
  }
}

export function wouldElementOverlap(
  elements: Array<{ startTime: number; duration: number; id: string }>,
  startTime: number,
  duration: number,
  excludeElementId?: string,
): boolean {
  const endTime = startTime + duration;
  return elements.some((el) => {
    if (excludeElementId && el.id === excludeElementId) return false;
    const elEnd = el.startTime + el.duration;
    return startTime < elEnd && endTime > el.startTime;
  });
}
