import { describe, expect, it } from "vitest";
import {
  PositionedItem,
  SECTION_HEADER_HEIGHT,
  computeMasonryLayout,
  computeSectionedLayout,
  nearestInDirection,
} from "./gridLayout";

const DENSITY = {
  targetColumnWidth: 280,
  gap: 20,
  minColumns: 1,
  maxColumns: 8,
};

// A 3x3 grid of 100x100 tiles on a 20px pitch — centers at 50/170/290.
const GRID: Record<string, PositionedItem> = {};
["a", "b", "c", "d", "e", "f", "g", "h", "i"].forEach((id, idx) => {
  const col = idx % 3;
  const row = Math.floor(idx / 3);
  GRID[id] = { id, x: col * 120, y: row * 120, width: 100, height: 100 };
});
// Layout:  a b c
//          d e f
//          g h i

describe("nearestInDirection", () => {
  it("moves to the adjacent tile on each axis from the center", () => {
    expect(nearestInDirection(GRID, "e", "left")).toBe("d");
    expect(nearestInDirection(GRID, "e", "right")).toBe("f");
    expect(nearestInDirection(GRID, "e", "up")).toBe("b");
    expect(nearestInDirection(GRID, "e", "down")).toBe("h");
  });

  it("returns null when there is nothing in that direction", () => {
    expect(nearestInDirection(GRID, "a", "left")).toBeNull();
    expect(nearestInDirection(GRID, "a", "up")).toBeNull();
    expect(nearestInDirection(GRID, "i", "right")).toBeNull();
    expect(nearestInDirection(GRID, "i", "down")).toBeNull();
  });

  it("stays in the same row/column rather than jumping diagonally", () => {
    // From the top-left, moving down should land on the tile directly below
    // (same column), never the closer-by-raw-distance diagonal neighbor.
    expect(nearestInDirection(GRID, "a", "down")).toBe("d");
    expect(nearestInDirection(GRID, "a", "right")).toBe("b");
  });

  it("returns null for an unknown origin id", () => {
    expect(nearestInDirection(GRID, "zzz", "down")).toBeNull();
  });
});

describe("computeMasonryLayout", () => {
  it("indexes every item in byId and keeps positions in sync", () => {
    const layout = computeMasonryLayout(
      [
        { id: "x", aspect: 1 },
        { id: "y", aspect: 1.5 },
      ],
      600,
      DENSITY,
    );
    expect(Object.keys(layout.byId)).toHaveLength(2);
    expect(layout.byId.x).toBe(layout.positions[0]);
  });
});

describe("computeSectionedLayout", () => {
  it("emits a band per group and stacks them top-to-bottom", () => {
    const layout = computeSectionedLayout(
      [
        { id: null, name: "Ungrouped", collapsed: false, items: [{ id: "a", aspect: 1 }] },
        { id: "s1", name: "Refs", collapsed: false, items: [{ id: "b", aspect: 1 }] },
      ],
      600,
      DENSITY,
    );
    expect(layout.bands.map((b) => b.id)).toEqual([null, "s1"]);
    expect(layout.bands[0].headerY).toBe(0);
    // Second band starts below the first header + its single row of content.
    expect(layout.bands[1].headerY).toBeGreaterThan(SECTION_HEADER_HEIGHT);
  });

  it("offsets a section's cards below its own header", () => {
    const layout = computeSectionedLayout(
      [{ id: "s1", name: "Refs", collapsed: false, items: [{ id: "b", aspect: 1 }] }],
      600,
      DENSITY,
    );
    expect(layout.byId.b.y).toBeGreaterThanOrEqual(SECTION_HEADER_HEIGHT);
  });

  it("renders a header but no cards for a collapsed section", () => {
    const layout = computeSectionedLayout(
      [{ id: "s1", name: "Refs", collapsed: true, items: [{ id: "b", aspect: 1 }] }],
      600,
      DENSITY,
    );
    expect(layout.bands).toHaveLength(1);
    expect(layout.bands[0].count).toBe(1);
    expect(layout.positions).toHaveLength(0);
    expect(layout.byId.b).toBeUndefined();
  });
});
