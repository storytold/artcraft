import { describe, expect, test } from "vitest";
import type { ElementBounds } from "../../preview/element-bounds";
import type { MaskHandleId, RectangleMaskParams } from "../types";
import { computeBoxMaskParamUpdate, getDefaultBaseMaskParams } from "./box-like";

// A 1000x1000 element centred at (500, 500); the mask is 500x500 in its middle.
const BOUNDS: ElementBounds = {
  cx: 500,
  cy: 500,
  width: 1000,
  height: 1000,
  rotation: 0,
};

describe("computeBoxMaskParamUpdate", () => {
  test("rotation handle turns the mask by the angle the pointer sweeps around the centre", () => {
    // The rotation handle sits 270px above the centre; drag it right by 270px.
    const update = computeBoxMaskParamUpdate({
      handleId: { kind: "rotation" },
      startParams: params({ rotation: 0 }),
      deltaX: 270,
      deltaY: 0,
      startCanvasX: 500,
      startCanvasY: 230,
      bounds: BOUNDS,
      canvasSize: { width: 1000, height: 1000 },
    });
    expect(update.rotation).toBeCloseTo(45, 5);
  });

  test("right edge of a mask rotated 90 degrees grows when dragged outward along its own axis", () => {
    // Rotated 90 degrees clockwise, the right edge handle is below the centre.
    // Dragging it 100px further down must widen the mask by 200px (0.2).
    const update = computeBoxMaskParamUpdate({
      handleId: { kind: "edge", side: "right" },
      startParams: params({ rotation: 90 }),
      deltaX: 0,
      deltaY: 100,
      startCanvasX: 500,
      startCanvasY: 750,
      bounds: BOUNDS,
      canvasSize: { width: 1000, height: 1000 },
    });
    expect(update.width).toBeCloseTo(0.7, 5);
  });

  test("corner handle stays under the pointer instead of lagging at half speed", () => {
    // The bottom-right corner is 250px right and 250px below the centre.
    // Dragging it 100px right and 100px down puts it 350px out, so the mask
    // becomes 700x700 (0.7).
    const update = computeBoxMaskParamUpdate({
      handleId: { kind: "corner", corner: { x: "right", y: "bottom" } },
      startParams: params({ rotation: 0 }),
      deltaX: 100,
      deltaY: 100,
      startCanvasX: 750,
      startCanvasY: 750,
      bounds: BOUNDS,
      canvasSize: { width: 1000, height: 1000 },
    });
    expect(update.width).toBeCloseTo(0.7, 5);
    expect(update.height).toBeCloseTo(0.7, 5);
  });

  test("right edge of an unrotated mask still widens by twice the drag", () => {
    const handleId: MaskHandleId = { kind: "edge", side: "right" };
    const update = computeBoxMaskParamUpdate({
      handleId,
      startParams: params({ rotation: 0 }),
      deltaX: 100,
      deltaY: 0,
      startCanvasX: 750,
      startCanvasY: 500,
      bounds: BOUNDS,
      canvasSize: { width: 1000, height: 1000 },
    });
    expect(update.width).toBeCloseTo(0.7, 5);
  });
});

function params(overrides: Partial<RectangleMaskParams>): RectangleMaskParams {
  return {
    ...getDefaultBaseMaskParams(),
    centerX: 0,
    centerY: 0,
    width: 0.5,
    height: 0.5,
    rotation: 0,
    scale: 1,
    ...overrides,
  };
}
