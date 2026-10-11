// Keyframe interpolation: cubic-bezier easing solver + per-track sampling.
// Kept dependency-free (only the timeline types + TransformSnap).

import type { TransformSnap } from "../editor/actions/snapshots";
import type { EasingSpec, TimelineTrack } from "./types";

// Evaluate one axis of a cubic bezier with endpoints (0,0)/(1,1) at
// parameter t. `a1`/`a2` are that axis's two control-point coordinates.
const bezierAxis = (t: number, a1: number, a2: number): number => {
  const c = 3 * a1;
  const b = 3 * (a2 - a1) - c;
  const a = 1 - c - b;
  return ((a * t + b) * t + c) * t;
};

const bezierAxisDerivative = (t: number, a1: number, a2: number): number => {
  const c = 3 * a1;
  const b = 3 * (a2 - a1) - c;
  const a = 1 - c - b;
  return (3 * a * t + 2 * b) * t + c;
};

// Given a normalized progress x in [0,1] along the segment, return the
// eased y. Solves bezierX(t) = x for t (Newton-Raphson), then reads y(t).
export const cubicBezierYForX = (easing: EasingSpec, x: number): number => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let t = x;
  let lower = 0;
  let upper = 1;
  for (let i = 0; i < 32; i++) {
    const err = bezierAxis(t, easing.p1x, easing.p2x) - x;
    if (err === 0) break;
    if (err < 0) lower = t;
    else upper = t;
    if (upper - lower < 1e-8) break;

    const d = bezierAxisDerivative(t, easing.p1x, easing.p2x);
    const next = Math.abs(d) > 1e-6 ? t - err / d : NaN;
    // Flat handles can send Newton outside the curve. Keep a bracket and
    // bisect whenever its next estimate would leave the valid interval.
    t = next > lower && next < upper ? next : (lower + upper) / 2;
  }
  return bezierAxis(t, easing.p1y, easing.p2y);
};

type Vec3 = { x: number; y: number; z: number };

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const lerpVec3 = (a: Vec3, b: Vec3, t: number): Vec3 => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  z: lerp(a.z, b.z, t),
});

// Sample a track's transform at the given time. Assumes keyframes are
// sorted ascending by time. Clamps to the first/last keyframe outside the
// keyed range. Returns null when the track has no keyframes.
export const sampleTrackAt = (
  track: TimelineTrack,
  time: number,
): TransformSnap | null => {
  const kfs = track.keyframes;
  if (kfs.length === 0) return null;
  if (kfs.length === 1 || time <= kfs[0].time) return kfs[0].transform;
  const last = kfs[kfs.length - 1];
  if (time >= last.time) return last.transform;

  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i];
    const b = kfs[i + 1];
    if (time >= a.time && time <= b.time) {
      const span = b.time - a.time;
      const x = span <= 0 ? 0 : (time - a.time) / span;
      const eased = cubicBezierYForX(a.easing, x);
      return {
        position: lerpVec3(a.transform.position, b.transform.position, eased),
        rotation: lerpVec3(a.transform.rotation, b.transform.rotation, eased),
        scale: lerpVec3(a.transform.scale, b.transform.scale, eased),
      };
    }
  }
  return last.transform;
};
