import type { SceneTracks, TrackType, TimelineTrack } from "../types";
import {
  getDefaultInsertIndexForTrack,
  getHighestInsertIndexForTrack,
  resolvePreferredNewTrackPlacement,
} from "./insert-index";
import { getTrackTypeForElementType } from "./compatibility";
import { enforceMainTrackStart } from "./main-track";
import { canPlaceTimeSpansOnTrack } from "./overlap";
import type {
  PlacementResult,
  PlacementStrategy,
  PlacementSubject,
  PlacementTimeSpan,
} from "./types";
import { ZERO_MEDIA_TIME } from "../../wasm";

// Strategy-dispatching placement resolver. Each strategy:
//   - explicit: place on a specific track (or fail if incompatible)
//   - firstAvailable: pick first compatible track that has space;
//     create a new track if none
//   - preferIndex: try the user's hover-target index, falling back to
//     a new track at that index with insertPosition: above/below
//   - aboveSource: prefer the track directly above the source track
//     (used when splitting one element across two tracks)
//   - alwaysNew: skip existing tracks entirely and create a new one

type ResolveTrackPlacementParams = PlacementSubject & {
  tracks: SceneTracks;
  timeSpans: PlacementTimeSpan[];
  strategy: PlacementStrategy;
};

function buildExistingTrackResult({
  track,
  trackIndex,
  tracks,
  timeSpans,
}: {
  track: TimelineTrack;
  trackIndex: number;
  tracks: SceneTracks;
  timeSpans: PlacementTimeSpan[];
}): PlacementResult {
  const firstSpan = timeSpans[0];
  const requestedStartTime = firstSpan?.startTime ?? ZERO_MEDIA_TIME;
  const adjustedStartTime = enforceMainTrackStart({
    tracks,
    targetTrackId: track.id,
    requestedStartTime,
    excludeElementId: firstSpan?.excludeElementId,
  });
  return {
    kind: "existingTrack",
    trackId: track.id,
    trackIndex,
    trackType: track.type,
    ...(adjustedStartTime !== requestedStartTime ? { adjustedStartTime } : {}),
  };
}

function buildNewTrackResult({
  trackType,
  insertIndex,
  insertPosition,
}: {
  trackType: TrackType;
  insertIndex: number;
  insertPosition: "above" | "below" | null;
}): PlacementResult {
  return {
    kind: "newTrack",
    trackType,
    insertIndex,
    insertPosition,
  };
}

function findFirstAvailableTrackIndex({
  tracks,
  trackType,
  timeSpans,
}: {
  tracks: TimelineTrack[];
  trackType: TrackType;
  timeSpans: PlacementTimeSpan[];
}): number {
  return tracks.findIndex((track) => {
    return (
      track.type === trackType &&
      canPlaceTimeSpansOnTrack({
        track,
        timeSpans,
      })
    );
  });
}

function resolveAlwaysNewTrack({
  tracks,
  trackType,
  position,
}: {
  tracks: SceneTracks;
  trackType: TrackType;
  position: "highest" | "default";
}): PlacementResult {
  const insertIndex =
    position === "highest"
      ? getHighestInsertIndexForTrack({
          tracks,
          trackType,
        })
      : getDefaultInsertIndexForTrack({
          tracks,
          trackType,
        });

  return buildNewTrackResult({
    trackType,
    insertIndex,
    insertPosition: null,
  });
}

function getInsertDirection({
  hoverDirection,
  verticalDragDirection,
}: {
  hoverDirection: "above" | "below";
  verticalDragDirection?: "up" | "down" | null;
}): "above" | "below" {
  if (verticalDragDirection === "up") {
    return "above";
  }

  if (verticalDragDirection === "down") {
    return "below";
  }

  return hoverDirection;
}

export function resolveTrackPlacement({
  tracks,
  ...placement
}: ResolveTrackPlacementParams): PlacementResult | null {
  const orderedTracks = [...tracks.overlay, tracks.main, ...tracks.audio];
  const trackType =
    "trackType" in placement
      ? placement.trackType
      : getTrackTypeForElementType({
          elementType: placement.elementType,
        });
  const { timeSpans, strategy } = placement;

  if (strategy.type === "explicit") {
    const trackIndex = orderedTracks.findIndex(
      (track) => track.id === strategy.trackId,
    );
    if (trackIndex < 0) {
      return null;
    }

    const track = orderedTracks[trackIndex];
    if (track.type !== trackType) {
      return null;
    }

    return buildExistingTrackResult({
      track,
      trackIndex,
      tracks,
      timeSpans,
    });
  }

  if (strategy.type === "firstAvailable") {
    const existingTrackIndex = findFirstAvailableTrackIndex({
      tracks: orderedTracks,
      trackType,
      timeSpans,
    });
    if (existingTrackIndex >= 0) {
      return buildExistingTrackResult({
        track: orderedTracks[existingTrackIndex],
        trackIndex: existingTrackIndex,
        tracks,
        timeSpans,
      });
    }

    return resolveAlwaysNewTrack({
      tracks,
      trackType,
      position: "highest",
    });
  }

  if (strategy.type === "preferIndex") {
    const preferredTrack = orderedTracks[strategy.trackIndex];
    const isPreferredTrackCompatible =
      !!preferredTrack && preferredTrack.type === trackType;
    const canUseExistingTrack =
      !strategy.createNewTrackOnly &&
      isPreferredTrackCompatible &&
      canPlaceTimeSpansOnTrack({
        track: preferredTrack,
        timeSpans,
      });
    if (canUseExistingTrack) {
      return buildExistingTrackResult({
        track: preferredTrack,
        trackIndex: strategy.trackIndex,
        tracks,
        timeSpans,
      });
    }

    const { insertIndex, insertPosition } = resolvePreferredNewTrackPlacement({
      tracks,
      trackType,
      preferredIndex: strategy.trackIndex,
      direction: getInsertDirection({
        hoverDirection: strategy.hoverDirection,
        verticalDragDirection: !isPreferredTrackCompatible
          ? strategy.verticalDragDirection
          : null,
      }),
    });
    return buildNewTrackResult({
      trackType,
      insertIndex,
      insertPosition,
    });
  }

  if (strategy.type === "aboveSource") {
    const aboveTrackIndex = strategy.sourceTrackIndex - 1;
    const aboveTrack = orderedTracks[aboveTrackIndex];
    if (
      aboveTrack &&
      aboveTrack.type === trackType &&
      canPlaceTimeSpansOnTrack({
        track: aboveTrack,
        timeSpans,
      })
    ) {
      return buildExistingTrackResult({
        track: aboveTrack,
        trackIndex: aboveTrackIndex,
        tracks,
        timeSpans,
      });
    }

    const firstAvailableTrackIndex = findFirstAvailableTrackIndex({
      tracks: orderedTracks,
      trackType,
      timeSpans,
    });
    if (firstAvailableTrackIndex >= 0) {
      return buildExistingTrackResult({
        track: orderedTracks[firstAvailableTrackIndex],
        trackIndex: firstAvailableTrackIndex,
        tracks,
        timeSpans,
      });
    }

    const insertIndex = getHighestInsertIndexForTrack({
      tracks,
      trackType,
    });

    return buildNewTrackResult({
      trackType,
      insertIndex,
      insertPosition: null,
    });
  }

  return resolveAlwaysNewTrack({
    tracks,
    trackType,
    position: strategy.position,
  });
}
