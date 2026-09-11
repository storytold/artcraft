import type { ElementRef, SceneTracks } from "../types";
import { findTrackInSceneTracks } from "../track-element-update";
import type { GroupMember, MoveGroup } from "./types";
import { getTrackPlacementById } from "./track-placement";
import { subMediaTime } from "../../wasm";

// Assembles a MoveGroup from the current selection + the element the
// user grabbed. Time offsets are computed relative to the anchor at
// build time and persist for the whole gesture — when the anchor
// moves to time T, member i moves to T + memberOffsets[i]. Missing
// elements / tracks are skipped silently; an empty group returns null.

export function buildMoveGroup({
  anchorRef,
  selectedElements,
  tracks,
}: {
  anchorRef: ElementRef;
  selectedElements: ElementRef[];
  tracks: SceneTracks;
}): MoveGroup | null {
  const anchorTrack = findTrackInSceneTracks({
    tracks,
    trackId: anchorRef.trackId,
  });
  const anchorElement = anchorTrack?.elements.find(
    (element) => element.id === anchorRef.elementId,
  );
  const anchorPlacement = getTrackPlacementById({
    tracks,
    trackId: anchorRef.trackId,
  });
  if (!anchorTrack || !anchorElement || !anchorPlacement) {
    return null;
  }

  const seen = new Set<string>();
  const orderedRefs = [anchorRef, ...selectedElements].filter((elementRef) => {
    if (seen.has(elementRef.elementId)) {
      return false;
    }

    seen.add(elementRef.elementId);
    return true;
  });

  const members = orderedRefs.flatMap((elementRef): GroupMember[] => {
    const track = findTrackInSceneTracks({
      tracks,
      trackId: elementRef.trackId,
    });
    const element = track?.elements.find(
      (trackElement) => trackElement.id === elementRef.elementId,
    );
    const placement = getTrackPlacementById({
      tracks,
      trackId: elementRef.trackId,
    });
    if (!track || !element || !placement) {
      return [];
    }

    return [
      {
        trackId: track.id,
        elementId: element.id,
        elementType: element.type,
        duration: element.duration,
        timeOffset: subMediaTime({
          a: element.startTime,
          b: anchorElement.startTime,
        }),
        trackSection: placement.section,
        sectionIndex: placement.sectionIndex,
        displayIndex: placement.displayIndex,
      },
    ];
  });

  if (members.length === 0) {
    return null;
  }

  const anchor = members.find(
    (member) =>
      member.trackId === anchorRef.trackId &&
      member.elementId === anchorRef.elementId,
  );
  if (!anchor) {
    return null;
  }

  return {
    anchor,
    members,
  };
}
