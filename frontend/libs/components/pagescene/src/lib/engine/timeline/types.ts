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

// An animation clip placed on an object's clip row. Only the reference +
// placement is serialized; the actual THREE.AnimationClip is resolved at
// runtime — from the `sourceMediaId` GLB for library clips, or from the
// object's own baked `animations[]` when `bakedClipIndex` is set.
export interface ClipStrip {
  id: string;
  sourceMediaId: string; // media id of the animation GLB ("" for baked clips)
  // Set for a clip baked into the object's own GLB: index into the object's
  // `animations[]` array. Baked clips are never removed from the THREE model —
  // removing/disabling a baked strip only stops scheduling it; the clip stays
  // on the object (and in the row's picker) for later reuse.
  bakedClipIndex?: number;
  name: string; // display label
  startTime: number; // seconds from timeline start
  duration: number; // seconds (clip length on the timeline)
  loop: boolean;
  // True until the clip GLB has loaded and its real length is known. While
  // true, `duration` is only a placeholder width and gets replaced by the
  // clip's natural length on load. A user trim clears this so the natural
  // length never clobbers a hand-set duration on reload. Baked strips know
  // their length up front and never set this.
  autoDuration?: boolean;
}

// One animation lane under an object; each lane holds a single clip strip.
// All of an object's strips render on ONE row and never overlap (see the
// overlap guard in TimelineController). Rows exist for characters and for
// any object with a skeleton or baked clips.
export interface ClipLane {
  id: string;
  objectUuid: string; // the object this lane animates
  strip: ClipStrip;
}

export interface TimelineData {
  duration: number; // seconds
  fps: number;
  tracks: TimelineTrack[]; // per-object transform keyframes
  clipLanes: ClipLane[]; // per-character skeletal animation clips
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
