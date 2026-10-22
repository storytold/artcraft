import { describe, expect, it } from "vitest";
import {
  buildFreeformSvgPath,
  findClosestPointOnFreeformSegment,
  freeformCanvasPointToLocal,
  freeformLocalPointToCanvas,
  getFreeformCanvasSegments,
  getFreeformPathClosedStateAfterPointRemoval,
  getFreeformSegmentCount,
  insertPointIntoFreeformSegment,
  parseFreeformPath,
  recenterFreeformPath,
  removeFreeformPathPoints,
  serializeFreeformPath,
  type FreeformPathPoint,
} from "./path";

const BOUNDS = { cx: 500, cy: 300, width: 400, height: 200, rotation: 0 };

function point(id: string, x: number, y: number): FreeformPathPoint {
  return { id, x, y, inX: 0, inY: 0, outX: 0, outY: 0 };
}

const TRIANGLE = [point("a", -0.25, -0.25), point("b", 0.25, -0.25), point("c", 0, 0.25)];

describe("parse and serialize", () => {
  it("round-trips points", () => {
    expect(parseFreeformPath({ path: serializeFreeformPath({ points: TRIANGLE }) })).toEqual(TRIANGLE);
  });

  it("returns an empty list for empty, malformed or non-array input", () => {
    expect(parseFreeformPath({ path: "" })).toEqual([]);
    expect(parseFreeformPath({ path: "{not json" })).toEqual([]);
    expect(parseFreeformPath({ path: '{"id":"a"}' })).toEqual([]);
  });

  it("drops entries that are not complete points", () => {
    const path = JSON.stringify([TRIANGLE[0], { id: "bad", x: 1 }, null, 5]);
    expect(parseFreeformPath({ path })).toEqual([TRIANGLE[0]]);
  });
});

describe("point removal", () => {
  it("removes the listed points and keeps the rest in order", () => {
    expect(removeFreeformPathPoints({ points: TRIANGLE, pointIds: ["b"] }).map((p) => p.id)).toEqual(["a", "c"]);
  });

  it("returns the same list when nothing is removed", () => {
    expect(removeFreeformPathPoints({ points: TRIANGLE, pointIds: [] })).toBe(TRIANGLE);
  });

  it("opens a closed path that drops below three points", () => {
    expect(getFreeformPathClosedStateAfterPointRemoval({ wasClosed: true, remainingPointCount: 3 })).toBe(true);
    expect(getFreeformPathClosedStateAfterPointRemoval({ wasClosed: true, remainingPointCount: 2 })).toBe(false);
    expect(getFreeformPathClosedStateAfterPointRemoval({ wasClosed: false, remainingPointCount: 9 })).toBe(false);
  });
});

describe("segment count", () => {
  it("counts n-1 open segments and n closed segments", () => {
    expect(getFreeformSegmentCount({ points: TRIANGLE, closed: false })).toBe(2);
    expect(getFreeformSegmentCount({ points: TRIANGLE, closed: true })).toBe(3);
  });

  it("has no segments for fewer than two points", () => {
    expect(getFreeformSegmentCount({ points: [], closed: true })).toBe(0);
    expect(getFreeformSegmentCount({ points: [TRIANGLE[0]], closed: true })).toBe(0);
  });
});

describe("coordinate conversion", () => {
  it("maps a local point to canvas space using the centre, bounds and scale", () => {
    const result = freeformLocalPointToCanvas({
      point: { x: 0.25, y: 0.5 },
      centerX: 0,
      centerY: 0,
      rotation: 0,
      scale: 1,
      bounds: BOUNDS,
    });
    expect(result).toEqual({ x: 600, y: 400 });
  });

  it("round-trips through a rotation and scale", () => {
    const args = { centerX: 0.1, centerY: -0.2, rotation: 30, scale: 1.5, bounds: BOUNDS };
    const canvas = freeformLocalPointToCanvas({ point: { x: 0.2, y: -0.1 }, ...args });
    const local = freeformCanvasPointToLocal({ point: canvas, ...args });
    expect(local.x).toBeCloseTo(0.2, 9);
    expect(local.y).toBeCloseTo(-0.1, 9);
  });
});

describe("segments and svg", () => {
  it("wraps the last closed segment back to the first point", () => {
    const segments = getFreeformCanvasSegments({
      points: TRIANGLE,
      centerX: 0,
      centerY: 0,
      rotation: 0,
      scale: 1,
      bounds: BOUNDS,
      closed: true,
    });
    expect(segments).toHaveLength(3);
    expect(segments[2].startPointId).toBe("c");
    expect(segments[2].endPointId).toBe("a");
  });

  it("closes the svg path with Z only when closed", () => {
    const args = { points: TRIANGLE, centerX: 0, centerY: 0, rotation: 0, scale: 1, bounds: BOUNDS };
    expect(buildFreeformSvgPath({ ...args, closed: true }).endsWith("Z")).toBe(true);
    expect(buildFreeformSvgPath({ ...args, closed: false })).not.toContain("Z");
    expect(buildFreeformSvgPath({ ...args, points: [], closed: true })).toBe("");
  });
});

describe("inserting a point into a segment", () => {
  it("splits a straight segment at its midpoint", () => {
    const next = insertPointIntoFreeformSegment({
      points: [point("a", 0, 0), point("b", 1, 0)],
      segmentIndex: 0,
      pointId: "m",
      t: 0.5,
      closed: false,
    });
    expect(next.map((p) => p.id)).toEqual(["a", "m", "b"]);
    expect(next[1].x).toBeCloseTo(0.5, 9);
    expect(next[1].y).toBeCloseTo(0, 9);
  });

  it("puts the new point of the closing segment between the last and first point", () => {
    const next = insertPointIntoFreeformSegment({
      points: TRIANGLE,
      segmentIndex: 2,
      pointId: "m",
      t: 0.5,
      closed: true,
    });
    expect(next).toHaveLength(4);
    const ids = next.map((p) => p.id);
    // Walking the loop, "m" must sit after "c" and before "a".
    const loop = [...ids.slice(ids.indexOf("c")), ...ids.slice(0, ids.indexOf("c"))];
    expect(loop).toEqual(["c", "m", "a", "b"]);
  });

  it("ignores a segment index that does not exist", () => {
    const points = [point("a", 0, 0), point("b", 1, 0)];
    expect(insertPointIntoFreeformSegment({ points, segmentIndex: 5, pointId: "m", t: 0.5, closed: false })).toBe(points);
  });
});

describe("closest point on a segment", () => {
  it("finds the foot of the perpendicular on a straight segment", () => {
    const result = findClosestPointOnFreeformSegment({
      points: [point("a", -0.25, 0), point("b", 0.25, 0)],
      segmentIndex: 0,
      canvasPoint: { x: 500, y: 350 },
      centerX: 0,
      centerY: 0,
      rotation: 0,
      scale: 1,
      bounds: BOUNDS,
      closed: false,
    });
    expect(result?.point.x).toBeCloseTo(500, 0);
    expect(result?.point.y).toBeCloseTo(300, 0);
  });

  it("returns null for a missing segment", () => {
    expect(
      findClosestPointOnFreeformSegment({
        points: TRIANGLE,
        segmentIndex: 9,
        canvasPoint: { x: 0, y: 0 },
        centerX: 0,
        centerY: 0,
        rotation: 0,
        scale: 1,
        bounds: BOUNDS,
        closed: true,
      }),
    ).toBeNull();
  });
});

describe("recentering", () => {
  it("keeps every point at the same canvas position", () => {
    const args = { centerX: 0.1, centerY: 0.1, rotation: 20, scale: 1.2, bounds: BOUNDS };
    const result = recenterFreeformPath({ points: TRIANGLE, ...args });
    TRIANGLE.forEach((original, index) => {
      const before = freeformLocalPointToCanvas({ point: original, ...args });
      const after = freeformLocalPointToCanvas({
        point: result.points[index],
        ...args,
        centerX: result.centerX,
        centerY: result.centerY,
      });
      expect(after.x).toBeCloseTo(before.x, 6);
      expect(after.y).toBeCloseTo(before.y, 6);
    });
  });
});
