import type { ElementRef, ElementType, TrackType } from "../types";
import type { MediaTime } from "../../wasm";

// Group-move types — the "moving N selected elements as one" gesture.
// The MoveGroup carries an anchor (the element the user grabbed) plus
// all selected members, each with their time offset from the anchor and
// a snapshot of which track section they live in. Members move
// together: when the anchor shifts to a new track, every member shifts
// by the same display-index delta.

export type GroupTrackSection = "overlay" | "main" | "audio";

export interface GroupMember extends ElementRef {
  elementType: ElementType;
  duration: MediaTime;
  timeOffset: MediaTime;
  trackSection: GroupTrackSection;
  sectionIndex: number;
  displayIndex: number;
}

export interface MoveGroup {
  anchor: GroupMember;
  members: GroupMember[];
}

export interface PlannedTrackCreation {
  id: string;
  type: TrackType;
  index: number;
}

export interface PlannedElementMove {
  sourceTrackId: string;
  targetTrackId: string;
  elementId: string;
  newStartTime: MediaTime;
}

export interface GroupMoveResult {
  moves: PlannedElementMove[];
  createTracks: PlannedTrackCreation[];
  targetSelection: ElementRef[];
}
