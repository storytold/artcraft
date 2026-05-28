import type { ElementType, TrackType } from "../types";
import type { MediaTime } from "../../wasm";

// The placement subsystem answers "where should this element go?" —
// the caller provides time spans + a strategy, and the resolver
// returns either an existing track to land on or a description of a
// new track to create. Commands then either reuse the existing track
// or build a new one in their execute().

export interface PlacementTimeSpan {
  startTime: MediaTime;
  duration: MediaTime;
  excludeElementId?: string;
}

export type PlacementSubject =
  | { elementType: ElementType }
  | { trackType: TrackType };

export type PlacementStrategy =
  | { type: "explicit"; trackId: string }
  | { type: "firstAvailable" }
  | {
      type: "preferIndex";
      trackIndex: number;
      hoverDirection: "above" | "below";
      verticalDragDirection?: "up" | "down" | null;
      createNewTrackOnly?: boolean;
    }
  | { type: "aboveSource"; sourceTrackIndex: number }
  | { type: "alwaysNew"; position: "highest" | "default" };

export type PlacementResult =
  | {
      kind: "existingTrack";
      trackId: string;
      trackIndex: number;
      trackType: TrackType;
      adjustedStartTime?: MediaTime;
    }
  | {
      kind: "newTrack";
      insertIndex: number;
      insertPosition: "above" | "below" | null;
      trackType: TrackType;
    };
