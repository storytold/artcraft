import { describe, expect, it } from "vitest";
import { snapPosition } from "./preview-snap";

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
