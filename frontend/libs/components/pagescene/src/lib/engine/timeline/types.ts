// Animation-timeline data model. Pure data (no THREE / no store imports)
// so it can be shared by the engine controller, the event bus, and the
// React UI without creating runtime cycles.
//
// A keyframe stores a full transform snapshot at a point in time; playback
// interpolates between consecutive keyframes using the LEFT keyframe's
// easing curve (the curve describes the motion INTO the next keyframe).

import type { TransformSnap } from "../editor/actions/snapshots";

// Cubic-bezier control points, CSS `cubic-bezier(p1x,p1y,p2x,p2y)` semantics
// with implicit endpoints P0=(0,0) and P3=(1,1).
export interface EasingSpec {
  p1x: number;
  p1y: number;
  p2x: number;
  p2y: number;
}

export interface Keyframe {
  id: string;
  time: number; // seconds from timeline start
  transform: TransformSnap;
  easing: EasingSpec; // curve into the next keyframe
}

export interface TimelineTrack {
  objectUuid: string;
  keyframes: Keyframe[]; // kept sorted ascending by time
}

export interface TimelineData {
  duration: number; // seconds
  fps: number;
  tracks: TimelineTrack[];
}

export type EasingPresetName = "linear" | "easeIn" | "easeOut" | "easeInOut";

export const EASING_PRESETS: Record<EasingPresetName, EasingSpec> = {
  linear: { p1x: 0, p1y: 0, p2x: 1, p2y: 1 },
  easeIn: { p1x: 0.42, p1y: 0, p2x: 1, p2y: 1 },
  easeOut: { p1x: 0, p1y: 0, p2x: 0.58, p2y: 1 },
  easeInOut: { p1x: 0.42, p1y: 0, p2x: 0.58, p2y: 1 },
};

export const DEFAULT_EASING: EasingSpec = EASING_PRESETS.easeInOut;
export const DEFAULT_TIMELINE_DURATION = 10; // seconds
export const DEFAULT_TIMELINE_FPS = 30;

export const cloneTimeline = (t: TimelineData): TimelineData =>
  JSON.parse(JSON.stringify(t));
