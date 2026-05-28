import type { ElementType, TrackType } from "../types";

// Element-to-track-type compatibility. Note that stickers + graphics
// share a "graphic" track type, and image + video share a "video"
// track type (so images can layer onto the same track as videos).

const ELEMENT_TRACK_MAP: Record<ElementType, TrackType> = {
  audio: "audio",
  text: "text",
  sticker: "graphic",
  graphic: "graphic",
  effect: "effect",
  video: "video",
  image: "video",
};

export function getTrackTypeForElementType({
  elementType,
}: {
  elementType: ElementType;
}): TrackType {
  return ELEMENT_TRACK_MAP[elementType];
}

export function canElementGoOnTrack({
  elementType,
  trackType,
}: {
  elementType: ElementType;
  trackType: TrackType;
}): boolean {
  return getTrackTypeForElementType({ elementType }) === trackType;
}

export function validateElementTrackCompatibility({
  element,
  track,
}: {
  element: { type: ElementType };
  track: { type: TrackType };
}): { isValid: boolean; errorMessage?: string } {
  const isValid = canElementGoOnTrack({
    elementType: element.type,
    trackType: track.type,
  });

  if (!isValid) {
    return {
      isValid: false,
      errorMessage: `${element.type} elements cannot be placed on ${track.type} tracks`,
    };
  }

  return { isValid: true };
}
