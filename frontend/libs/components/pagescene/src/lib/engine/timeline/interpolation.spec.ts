import { describe, expect, it } from "vitest";
import { cubicBezierYForX, sampleTrackAt } from "./interpolation";
import { EASING_PRESETS, type EasingSpec, type TimelineTrack } from "./types";

const FLAT_START: EasingSpec = { p1x: 0, p1y: 1 / 3, p2x: 0, p2y: 2 / 3 };
const FLAT_END: EasingSpec = { p1x: 1, p1y: 1 / 3, p2x: 1, p2y: 2 / 3 };

describe("cubicBezierYForX", () => {
  it.each([0.000001, 0.0001, 0.001, 0.01, 0.1, 0.5])(
    "solves the flat-start curve at %s without snapping to its end",
    (x) => {
      // For these control points X(t) = t^3 and Y(t) = t.
      expect(cubicBezierYForX(FLAT_START, x)).toBeCloseTo(Math.cbrt(x), 6);
    },
  );

  it.each([0.5, 0.9, 0.99, 0.999, 0.9999, 0.999999])(
    "solves the flat-end curve at %s without snapping to its start",
    (x) => {
      expect(cubicBezierYForX(FLAT_END, x)).toBeCloseTo(1 - Math.cbrt(1 - x), 6);
    },
  );

  it.each(Object.values(EASING_PRESETS))("preserves endpoints for %j", (curve) => {
    expect(cubicBezierYForX(curve, 0)).toBe(0);
    expect(cubicBezierYForX(curve, 1)).toBe(1);
  });

  it.each([0.001, 0.25, 0.5, 0.75, 0.999])("keeps linear progress at %s", (x) => {
    expect(cubicBezierYForX(EASING_PRESETS.linear, x)).toBeCloseTo(x, 5);
  });

  it("uses the solved curve when sampling an object transform", () => {
    const track: TimelineTrack = {
      objectUuid: "animated-object",
      keyframes: [
        { id: "start", time: 0, easing: FLAT_START, transform: {
          position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 },
        } },
        { id: "end", time: 10, easing: EASING_PRESETS.linear, transform: {
          position: { x: 100, y: 0, z: 0 }, rotation: { x: 1, y: 0, z: 0 }, scale: { x: 2, y: 1, z: 1 },
        } },
      ],
    };
    const sample = sampleTrackAt(track, 0.01)!;
    expect(sample.position.x).toBeCloseTo(10, 5);
    expect(sample.rotation.x).toBeCloseTo(0.1, 6);
    expect(sample.scale.x).toBeCloseTo(1.1, 6);
  });
});
