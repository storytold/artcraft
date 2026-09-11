import type { FrameRate } from "opencut-wasm";
import type { ElementRef, RetimeConfig } from "../types";
import type { MediaTime } from "../../wasm";

// Group resize — N selected elements dragged from one edge.
// GroupResizeMember carries the "fixed" data the solver needs:
// current bounds, trim limits, optional retime, and per-side
// neighbour bounds (the next element on the same track) that
// cap how far this member can grow.

export type ResizeSide = "left" | "right";

export interface GroupResizeMember extends ElementRef {
  startTime: MediaTime;
  duration: MediaTime;
  trimStart: MediaTime;
  trimEnd: MediaTime;
  sourceDuration?: MediaTime;
  retime?: RetimeConfig;
  leftNeighborBound: MediaTime | null;
  rightNeighborBound: MediaTime | null;
}

export interface GroupResizeUpdate extends ElementRef {
  patch: {
    trimStart: MediaTime;
    trimEnd: MediaTime;
    startTime: MediaTime;
    duration: MediaTime;
  };
}

export interface GroupResizeResult {
  deltaTime: MediaTime;
  updates: GroupResizeUpdate[];
}

export interface ComputeGroupResizeArgs {
  members: GroupResizeMember[];
  side: ResizeSide;
  deltaTime: MediaTime;
  fps: FrameRate;
}
