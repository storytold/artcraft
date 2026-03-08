import type { TimelineTrack, ElementType, DropTarget } from "../../types";
import { PIXELS_PER_SECOND, TRACK_GAP } from "../../constants/timeline";
import { getTrackHeight, canElementGoOnTrack, wouldElementOverlap } from "./track-utils";

export function computeDropTarget({
  elementType,
  mouseX,
  mouseY,
  tracks,
  elementDuration,
  zoomLevel,
  excludeElementId,
}: {
  elementType: ElementType;
  mouseX: number;
  mouseY: number;
  tracks: TimelineTrack[];
  elementDuration: number;
  zoomLevel: number;
  excludeElementId?: string;
}): DropTarget | null {
  const pps = PIXELS_PER_SECOND * zoomLevel;
  const xPosition = Math.max(0, mouseX / pps);

  // Find which track the mouse is over
  let cumulativeY = 0;
  for (let i = 0; i < tracks.length; i++) {
    const trackHeight = getTrackHeight(tracks[i].type);
    const trackTop = cumulativeY;
    const trackBottom = cumulativeY + trackHeight;

    if (mouseY >= trackTop && mouseY < trackBottom) {
      if (!canElementGoOnTrack(elementType, tracks[i].type)) {
        return null;
      }
      const hasOverlap = wouldElementOverlap(
        tracks[i].elements,
        xPosition,
        elementDuration,
        excludeElementId,
      );
      if (hasOverlap) return null;

      return {
        trackIndex: i,
        isNewTrack: false,
        insertPosition: null,
        xPosition,
        targetElement: null,
      };
    }

    cumulativeY = trackBottom + TRACK_GAP;
  }

  // Mouse is below all tracks — create new track
  return {
    trackIndex: tracks.length,
    isNewTrack: true,
    insertPosition: "below",
    xPosition,
    targetElement: null,
  };
}
