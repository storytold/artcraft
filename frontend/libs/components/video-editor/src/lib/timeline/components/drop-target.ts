import type { TimelineTrack, TimelineElement } from "../types";
import type { ComputeDropTargetParams, DropTarget } from "../types";
import { resolveTrackPlacement } from "../placement";
import { TIMELINE_TRACK_GAP_PX } from "./layout";
import { getTrackHeight } from "./track-layout";
import {
  mediaTime,
  type MediaTime,
  roundMediaTime,
  TICKS_PER_SECOND,
} from "../../wasm";

function findElementAtPosition({
  mouseX,
  tracks,
  trackIndex,
  targetElementTypes,
  pixelsPerSecond,
  zoomLevel,
}: {
  mouseX: number;
  tracks: TimelineTrack[];
  trackIndex: number;
  targetElementTypes: string[];
  pixelsPerSecond: number;
  zoomLevel: number;
}): { elementId: string; trackId: string } | null {
  const time = mediaTime({
    ticks: Math.round(
      (mouseX / (pixelsPerSecond * zoomLevel)) * TICKS_PER_SECOND,
    ),
  });
  const track = tracks[trackIndex];
  if (!track || !("elements" in track)) return null;

  const hit = track.elements.find(
    (element: TimelineElement) =>
      targetElementTypes.includes(element.type) &&
      element.startTime <= time &&
      time < element.startTime + element.duration,
  );
  if (!hit) return null;
  return { elementId: hit.id, trackId: track.id };
}

function getTrackAtY({
  mouseY,
  tracks,
  verticalDragDirection,
}: {
  mouseY: number;
  tracks: TimelineTrack[];
  verticalDragDirection?: "up" | "down" | null;
}): { trackIndex: number; relativeY: number } | null {
  let cumulativeHeight = 0;

  for (let i = 0; i < tracks.length; i++) {
    const trackHeight = getTrackHeight({ type: tracks[i].type });
    const trackTop = cumulativeHeight;
    const trackBottom = trackTop + trackHeight;

    if (mouseY >= trackTop && mouseY < trackBottom) {
      return {
        trackIndex: i,
        relativeY: mouseY - trackTop,
      };
    }

    if (i < tracks.length - 1 && verticalDragDirection) {
      const gapTop = trackBottom;
      const gapBottom = gapTop + TIMELINE_TRACK_GAP_PX;
      if (mouseY >= gapTop && mouseY < gapBottom) {
        const isDraggingUp = verticalDragDirection === "up";
        return {
          trackIndex: isDraggingUp ? i : i + 1,
          relativeY: isDraggingUp ? trackHeight - 1 : 0,
        };
      }
    }

    cumulativeHeight += trackHeight + TIMELINE_TRACK_GAP_PX;
  }

  return null;
}

const EMPTY_TARGET_ELEMENT = null;

function fallbackNewTrackDropTarget({
  xPosition,
}: {
  xPosition: MediaTime;
}): DropTarget {
  return {
    trackIndex: 0,
    isNewTrack: true,
    insertPosition: null,
    xPosition,
    targetElement: EMPTY_TARGET_ELEMENT,
  };
}

export function computeDropTarget({
  elementType,
  mouseX,
  mouseY,
  tracks,
  playheadTime,
  isExternalDrop,
  elementDuration,
  pixelsPerSecond,
  zoomLevel,
  verticalDragDirection,
  startTimeOverride,
  excludeElementId,
  targetElementTypes,
}: ComputeDropTargetParams): DropTarget {
  const orderedTracks = [...tracks.overlay, tracks.main, ...tracks.audio];
  const mainTrackIndex = tracks.overlay.length;
  const xPosition =
    startTimeOverride !== undefined
      ? startTimeOverride
      : isExternalDrop
        ? playheadTime
        : mediaTime({
            ticks: Math.round(
              Math.max(0, mouseX / (pixelsPerSecond * zoomLevel)) *
                TICKS_PER_SECOND,
            ),
          });

  if (orderedTracks.length === 0) {
    const placementResult = resolveTrackPlacement({
      tracks,
      elementType,
      timeSpans: [{ startTime: xPosition, duration: elementDuration, excludeElementId }],
      strategy: {
        type: "preferIndex",
        trackIndex: 0,
        hoverDirection: "below",
        createNewTrackOnly: true,
      },
    });
    const emptyTimelineResult =
      placementResult?.kind === "newTrack" ? placementResult : null;
    if (!emptyTimelineResult) {
      return fallbackNewTrackDropTarget({ xPosition });
    }

    return {
      trackIndex: emptyTimelineResult.insertIndex,
      isNewTrack: true,
      insertPosition: emptyTimelineResult.insertPosition,
      xPosition,
      targetElement: EMPTY_TARGET_ELEMENT,
    };
  }

  const trackAtMouse = getTrackAtY({
    mouseY,
    tracks: orderedTracks,
    verticalDragDirection,
  });

  if (!trackAtMouse) {
    const isAboveAllTracks = mouseY < 0;

    const placementResult = resolveTrackPlacement({
      tracks,
      elementType,
      timeSpans: [{ startTime: xPosition, duration: elementDuration, excludeElementId }],
      strategy: {
        type: "preferIndex",
        trackIndex: isAboveAllTracks ? 0 : orderedTracks.length - 1,
        hoverDirection: isAboveAllTracks ? "above" : "below",
        createNewTrackOnly: true,
      },
    });
    const outOfBoundsResult =
      placementResult?.kind === "newTrack" ? placementResult : null;
    if (!outOfBoundsResult) {
      return fallbackNewTrackDropTarget({ xPosition });
    }

    return {
      trackIndex: outOfBoundsResult.insertIndex,
      isNewTrack: true,
      insertPosition: outOfBoundsResult.insertPosition,
      xPosition,
      targetElement: EMPTY_TARGET_ELEMENT,
    };
  }

  const { trackIndex, relativeY } = trackAtMouse;
  const track = orderedTracks[trackIndex];

  if (targetElementTypes && targetElementTypes.length > 0) {
    const targetElement = findElementAtPosition({
      mouseX,
      tracks: orderedTracks,
      trackIndex,
      targetElementTypes,
      pixelsPerSecond,
      zoomLevel,
    });
    if (targetElement) {
      return {
        trackIndex,
        isNewTrack: false,
        insertPosition: null,
        xPosition,
        targetElement,
      };
    }
  }

  const trackHeight = getTrackHeight({ type: track.type });
  const placementResult = resolveTrackPlacement({
    tracks,
    elementType,
    timeSpans: [{ startTime: xPosition, duration: elementDuration, excludeElementId }],
    strategy: {
      type: "preferIndex",
      trackIndex,
      hoverDirection: relativeY < trackHeight / 2 ? "above" : "below",
      verticalDragDirection,
    },
  });
  if (!placementResult) {
    return fallbackNewTrackDropTarget({ xPosition });
  }

  if (placementResult.kind === "existingTrack") {
    const adjustedXPosition =
      placementResult.adjustedStartTime !== undefined
        ? roundMediaTime({ time: placementResult.adjustedStartTime })
        : xPosition;

    return {
      trackIndex: placementResult.trackIndex,
      isNewTrack: false,
      insertPosition: null,
      xPosition: adjustedXPosition,
      targetElement: EMPTY_TARGET_ELEMENT,
    };
  }

  return {
    trackIndex: placementResult.insertIndex,
    isNewTrack: true,
    insertPosition: placementResult.insertPosition,
    xPosition,
    targetElement: EMPTY_TARGET_ELEMENT,
  };
}

export function getDropLineY({
  dropTarget,
  tracks,
}: {
  dropTarget: DropTarget;
  tracks: TimelineTrack[];
}): number {
  const safeTrackIndex = Math.min(
    Math.max(dropTarget.trackIndex, 0),
    tracks.length,
  );
  let y = 0;

  for (let i = 0; i < safeTrackIndex; i++) {
    y += getTrackHeight({ type: tracks[i].type }) + TIMELINE_TRACK_GAP_PX;
  }

  return y;
}
