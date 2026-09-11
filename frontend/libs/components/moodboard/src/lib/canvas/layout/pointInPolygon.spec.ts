import { pointInPolygon } from "./pointInPolygon";
import {
  segmentsIntersect,
  polygonIntersectsRect,
} from "./segmentsIntersect";

const square = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];

describe("pointInPolygon", () => {
  it("returns true for points strictly inside", () => {
    expect(pointInPolygon({ x: 5, y: 5 }, square)).toBe(true);
  });
  it("returns false for points outside", () => {
    expect(pointInPolygon({ x: 20, y: 5 }, square)).toBe(false);
  });
  it("returns false for degenerate polygons", () => {
    expect(pointInPolygon({ x: 0, y: 0 }, [{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe(false);
  });
});

describe("segmentsIntersect", () => {
  it("detects crossing segments", () => {
    expect(
      segmentsIntersect({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 }),
    ).toBe(true);
  });
  it("rejects non-crossing segments", () => {
    expect(
      segmentsIntersect({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 5, y: 5 }, { x: 6, y: 6 }),
    ).toBe(false);
  });
});

describe("polygonIntersectsRect", () => {
  it("returns true when an edge crosses a rect side", () => {
    const polyline = [
      { x: -5, y: 5 },
      { x: 15, y: 5 },
    ];
    expect(polygonIntersectsRect(polyline, { x: 0, y: 0, width: 10, height: 10 })).toBe(true);
  });
  it("returns false when polygon is entirely outside and does not touch", () => {
    const polyline = [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
    ];
    expect(polygonIntersectsRect(polyline, { x: 0, y: 0, width: 10, height: 10 })).toBe(false);
  });
});
