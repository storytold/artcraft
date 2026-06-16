import { describe, expect, it } from "vitest";
import {
  PositionedItem,
  computeMasonryLayout,
  nearestInDirection,
} from "./gridLayout";

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
      { targetColumnWidth: 280, gap: 20, minColumns: 1, maxColumns: 8 },
    );
    expect(Object.keys(layout.byId)).toHaveLength(2);
    expect(layout.byId.x).toBe(layout.positions[0]);
  });
});
