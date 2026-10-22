import { describe, expect, it } from "vitest";
import {
  getBoxMaskRectOverlay,
  getBoxMaskShapeOverlay,
} from "./handle-positions";

// A horizontally flipped element has a negative width in its bounds (scaleX < 0).
const FLIPPED_BOUNDS = { cx: 500, cy: 300, width: -400, height: 200, rotation: 0 };
const NORMAL_BOUNDS = { cx: 500, cy: 300, width: 400, height: 200, rotation: 0 };

describe("box mask overlays on a flipped element", () => {
  it("gives the bounding-box outline a positive width and height", () => {
    const overlay = getBoxMaskRectOverlay({
      centerX: 0.1,
      centerY: 0,
      width: 0.5,
      height: 0.5,
      rotation: 0,
      bounds: FLIPPED_BOUNDS,
    });
    expect(overlay.width).toBe(200);
    expect(overlay.height).toBe(100);
    // The centre still mirrors with the element.
    expect(overlay.center.x).toBe(460);
  });

  it("gives the shape outline a positive width and height", () => {
    const overlay = getBoxMaskShapeOverlay({
      centerX: 0,
      centerY: 0,
      width: 0.5,
      height: 0.5,
      rotation: 0,
      bounds: FLIPPED_BOUNDS,
      pathData: "M0,0",
    });
    expect(overlay.width).toBe(200);
    expect(overlay.height).toBe(100);
  });

  it("leaves a normal element unchanged", () => {
    const overlay = getBoxMaskRectOverlay({
      centerX: 0.1,
      centerY: 0,
      width: 0.5,
      height: 0.5,
      rotation: 0,
      bounds: NORMAL_BOUNDS,
    });
    expect(overlay.width).toBe(200);
    expect(overlay.center.x).toBe(540);
  });
});
