// Shared easing curves for the entrance animations. Kept as plain scalar
// functions so both the transform-based mesh drop and the shader-driven splat
// settle pull from the same vocabulary of motion.

export function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Decelerate to rest — the default for things arriving. */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Accelerate from rest — reads as gravity for a fall. */
export function easeInCubic(t: number): number {
  return t * t * t;
}

/** Stronger gravity feel for the drop phase. */
export function easeInQuart(t: number): number {
  return t * t * t * t;
}

/** Symmetric ease for settling motions. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Overshoot-and-settle — the "pop" when an object first appears. */
export function easeOutBack(t: number, overshoot = 1.70158): number {
  const c3 = overshoot + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2);
}
