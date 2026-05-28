import type { ScalarAnimationKey } from "./types";

// Cubic-Bezier interpolation helpers. Used by the scalar curve channel
// to map elapsed time → progress along a custom-shaped easing curve.
// solveBezierProgressForTime uses bisection (20 iterations is enough
// for sub-pixel accuracy at typical timeline scales) since the Bezier
// is not invertible in closed form.

const BEZIER_SOLVE_ITERATIONS = 20;

export function getBezierPoint({
  progress,
  p0,
  p1,
  p2,
  p3,
}: {
  progress: number;
  p0: number;
  p1: number;
  p2: number;
  p3: number;
}) {
  const mt = 1 - progress;
  return (
    mt * mt * mt * p0 +
    3 * mt * mt * progress * p1 +
    3 * mt * progress * progress * p2 +
    progress * progress * progress * p3
  );
}

export function getDefaultRightHandle({
  leftKey,
  rightKey,
}: {
  leftKey: ScalarAnimationKey;
  rightKey: ScalarAnimationKey;
}) {
  const span = rightKey.time - leftKey.time;
  const valueDelta = rightKey.value - leftKey.value;
  return {
    dt: span / 3,
    dv: valueDelta / 3,
  };
}

export function getDefaultLeftHandle({
  leftKey,
  rightKey,
}: {
  leftKey: ScalarAnimationKey;
  rightKey: ScalarAnimationKey;
}) {
  const span = rightKey.time - leftKey.time;
  const valueDelta = rightKey.value - leftKey.value;
  return {
    dt: -span / 3,
    dv: -valueDelta / 3,
  };
}

export function solveBezierProgressForTime({
  time,
  leftKey,
  rightKey,
}: {
  time: number;
  leftKey: ScalarAnimationKey;
  rightKey: ScalarAnimationKey;
}) {
  let lower = 0;
  let upper = 1;
  const rightHandle =
    leftKey.rightHandle ?? getDefaultRightHandle({ leftKey, rightKey });
  const leftHandle =
    rightKey.leftHandle ?? getDefaultLeftHandle({ leftKey, rightKey });

  for (let iteration = 0; iteration < BEZIER_SOLVE_ITERATIONS; iteration++) {
    const mid = (lower + upper) / 2;
    const estimate = getBezierPoint({
      progress: mid,
      p0: leftKey.time,
      p1: leftKey.time + rightHandle.dt,
      p2: rightKey.time + leftHandle.dt,
      p3: rightKey.time,
    });
    if (estimate < time) {
      lower = mid;
    } else {
      upper = mid;
    }
  }

  return (lower + upper) / 2;
}
