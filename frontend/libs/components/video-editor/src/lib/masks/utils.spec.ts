import { describe, expect, it } from "vitest";
import { halfPlaneSign, lineEdgeIntersection } from "./utils";

// A vertical cutting line at x = 5 with its normal pointing toward +x.
const line = { lineX: 5, lineY: 0, normalX: 1, normalY: 0 };

describe("halfPlaneSign", () => {
  it("is positive on the normal side, negative on the other, zero on the line", () => {
    expect(halfPlaneSign({ ...line, x: 8, y: 3 })).toBe(3);
    expect(halfPlaneSign({ ...line, x: 2, y: 3 })).toBe(-3);
    expect(halfPlaneSign({ ...line, x: 5, y: 9 })).toBe(0);
  });
});

describe("lineEdgeIntersection", () => {
  it("finds where the line crosses a segment", () => {
    expect(lineEdgeIntersection({ ...line, x1: 0, y1: 0, x2: 10, y2: 10 })).toEqual({ x: 5, y: 5 });
  });

  it("returns null when both endpoints are on the same side", () => {
    expect(lineEdgeIntersection({ ...line, x1: 6, y1: 0, x2: 9, y2: 4 })).toBeNull();
    expect(lineEdgeIntersection({ ...line, x1: 0, y1: 0, x2: 4, y2: 4 })).toBeNull();
  });

  it("returns null for a segment parallel to the line", () => {
    expect(lineEdgeIntersection({ ...line, x1: 3, y1: 0, x2: 3, y2: 10 })).toBeNull();
  });

  it("treats an endpoint lying on the line as a crossing", () => {
    expect(lineEdgeIntersection({ ...line, x1: 5, y1: 2, x2: 9, y2: 2 })).toEqual({ x: 5, y: 2 });
  });
});
