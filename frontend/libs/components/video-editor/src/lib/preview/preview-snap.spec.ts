import { describe, expect, it } from "vitest";
import { snapPosition, snapScale, snapScaleAxes } from "./preview-snap";

const CANVAS = { width: 1000, height: 1000 };
const THRESHOLD = { x: 10, y: 10 };

describe("snapPosition with a flipped element", () => {
  // A flipped element reports a negative width; its rotated footprint is still (|W| cos + H sin) wide.
  it("snaps a rotated flipped element by its true footprint", () => {
    const halfFootprint = ((400 + 200) * Math.SQRT1_2) / 2;
    const flushLeftX = -500 + halfFootprint;
    const result = snapPosition({
      proposedPosition: { x: flushLeftX + 3, y: 400 },
      canvasSize: CANVAS,
      elementSize: { width: -400, height: 200 },
      rotation: 45,
      snapThreshold: THRESHOLD,
    });
    expect(result.snappedPosition.x).toBeCloseTo(flushLeftX, 5);
  });

  it("matches the unflipped element", () => {
    const flipped = snapPosition({
      proposedPosition: { x: -280, y: 400 },
      canvasSize: CANVAS,
      elementSize: { width: -400, height: 200 },
      rotation: 45,
      snapThreshold: THRESHOLD,
    });
    const normal = snapPosition({
      proposedPosition: { x: -280, y: 400 },
      canvasSize: CANVAS,
      elementSize: { width: 400, height: 200 },
      rotation: 45,
      snapThreshold: THRESHOLD,
    });
    expect(flipped).toEqual(normal);
  });
});

describe("scale snapping with a negative base size (mask on a flipped element)", () => {
  it("snapScale gives the same result for a negative base size", () => {
    const args = {
      proposedScale: 2.49,
      position: { x: 0, y: 0 },
      baseWidth: 400,
      baseHeight: 200,
      canvasSize: CANVAS,
      snapThreshold: THRESHOLD,
    };
    const normal = snapScale(args);
    const flipped = snapScale({ ...args, baseWidth: -400 });
    expect(normal.snappedScale).toBeCloseTo(2.5, 5);
    expect(flipped).toEqual(normal);
  });

  it("snapScaleAxes gives the same result for a negative base size", () => {
    const args = {
      proposedScaleX: 2.49,
      proposedScaleY: 1,
      position: { x: 0, y: 0 },
      baseWidth: 400,
      baseHeight: 200,
      canvasSize: CANVAS,
      snapThreshold: THRESHOLD,
    };
    const normal = snapScaleAxes(args);
    const flipped = snapScaleAxes({ ...args, baseWidth: -400 });
    expect(normal.x.snappedScale).toBeCloseTo(2.5, 5);
    expect(flipped).toEqual(normal);
  });
});
