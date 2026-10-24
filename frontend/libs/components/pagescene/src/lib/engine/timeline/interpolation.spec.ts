import { describe, expect, it } from "vitest";
import { cubicBezierYForX } from "./interpolation";
import type { EasingSpec } from "./types";

// Reads the curve's x back at parameter t so a test can check the solver
// really landed on the requested x (y of the points stays 0..1 here).
const bezierX = (t: number, p1x: number, p2x: number): number =>
  3 * (1 - t) * (1 - t) * t * p1x + 3 * (1 - t) * t * t * p2x + t * t * t;

describe("cubicBezierYForX", () => {
  it("returns the endpoints outside the 0..1 range", () => {
    const e: EasingSpec = { p1x: 0.42, p1y: 0, p2x: 0.58, p2y: 1 };
    expect(cubicBezierYForX(e, 0)).toBe(0);
    expect(cubicBezierYForX(e, 1)).toBe(1);
  });

  it("is linear for the linear preset", () => {
    const e: EasingSpec = { p1x: 0, p1y: 0, p2x: 1, p2y: 1 };
    expect(cubicBezierYForX(e, 0.3)).toBeCloseTo(0.3, 4);
  });

  it("solves a curve whose two handles are both dragged to x = 0", () => {
    // x(t) = t^3, so x = 0.005 sits at t = cbrt(0.005). The slope there is
    // tiny, and the old Newton step overshot to t = 1 and returned y = 1.
    const e: EasingSpec = { p1x: 0, p1y: 0, p2x: 0, p2y: 1 };
    const x = 0.005;
    const t = Math.cbrt(x);
    const y = cubicBezierYForX(e, x);
    expect(bezierX(t, 0, 0)).toBeCloseTo(x, 8);
    expect(y).toBeCloseTo(3 * t * t * (1 - t) + t * t * t, 3);
  });

  it("solves a curve whose two handles are both dragged to x = 1", () => {
    // x(t) = 1 - (1 - t)^3. x = 0.995 sits at t = 1 - cbrt(0.005).
    const e: EasingSpec = { p1x: 1, p1y: 0, p2x: 1, p2y: 1 };
    const t = 1 - Math.cbrt(0.005);
    const y = cubicBezierYForX(e, 0.995);
    expect(y).toBeCloseTo(3 * t * t * (1 - t) + t * t * t, 3);
  });
});
