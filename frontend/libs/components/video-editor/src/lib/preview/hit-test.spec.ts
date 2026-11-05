import { describe, expect, it } from "vitest";
import { getHitElements, hitTest, resolvePreferredHit } from "./hit-test";
import { canvasToOverlay, positionToOverlay, screenPixelsToLogicalThreshold, screenToCanvas } from "./preview-coords";

function entry(id: string, bounds: Partial<{ cx: number; cy: number; width: number; height: number; rotation: number }>) {
  return {
    trackId: `t-${id}`,
    elementId: id,
    element: {} as never,
    bounds: { cx: 100, cy: 100, width: 100, height: 50, rotation: 0, ...bounds },
  };
}

describe("hit testing", () => {
  it("hits inside and misses outside an unrotated box", () => {
    const list = [entry("a", {})];
    expect(hitTest({ canvasX: 100, canvasY: 100, elementsWithBounds: list })?.elementId).toBe("a");
    expect(hitTest({ canvasX: 151, canvasY: 100, elementsWithBounds: list })).toBeNull();
  });

  it("follows the rotation of the box", () => {
    // 100x50 box rotated 90 degrees is 50 wide and 100 tall.
    const list = [entry("a", { rotation: 90 })];
    expect(hitTest({ canvasX: 100, canvasY: 140, elementsWithBounds: list })?.elementId).toBe("a");
    expect(hitTest({ canvasX: 140, canvasY: 100, elementsWithBounds: list })).toBeNull();
  });

  it("hits a flipped element with negative bounds", () => {
    const list = [entry("a", { width: -100, height: -50 })];
    expect(hitTest({ canvasX: 120, canvasY: 110, elementsWithBounds: list })?.elementId).toBe("a");
  });

  it("returns hits topmost first (last in the list is on top)", () => {
    const list = [entry("bottom", {}), entry("top", {})];
    expect(getHitElements({ canvasX: 100, canvasY: 100, elementsWithBounds: list }).map((h) => h.elementId)).toEqual(["top", "bottom"]);
  });

  it("prefers an already selected hit even when it is underneath", () => {
    const list = [entry("bottom", {}), entry("top", {})];
    const hits = getHitElements({ canvasX: 100, canvasY: 100, elementsWithBounds: list });
    expect(resolvePreferredHit({ hits, preferredElements: [{ trackId: "t-bottom", elementId: "bottom" }] })?.elementId).toBe("bottom");
    expect(resolvePreferredHit({ hits, preferredElements: [] })).toBeNull();
  });
});

describe("preview coordinates", () => {
  const geometry = {
    canvasWidth: 1920,
    canvasHeight: 1080,
    centerX: 960,
    centerY: 540,
    scale: 0.5,
    viewportWidth: 800,
    viewportHeight: 600,
  };
  const rect = { left: 10, top: 20 } as DOMRect;

  it("round-trips a canvas point through the overlay and back", () => {
    const overlay = canvasToOverlay({ canvasX: 300, canvasY: 200, geometry });
    const canvas = screenToCanvas({ clientX: overlay.x + rect.left, clientY: overlay.y + rect.top, geometry, viewportRect: rect });
    expect(canvas.x).toBeCloseTo(300, 9);
    expect(canvas.y).toBeCloseTo(200, 9);
  });

  it("puts the canvas centre at the viewport centre", () => {
    expect(positionToOverlay({ positionX: 0, positionY: 0, geometry })).toEqual({ x: 400, y: 300 });
  });

  it("converts screen pixels to a logical threshold", () => {
    expect(screenPixelsToLogicalThreshold({ geometry, screenPixels: 6 })).toEqual({ x: 12, y: 12 });
  });
});
