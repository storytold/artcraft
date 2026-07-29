import { computeAABB } from "./geometry";
import { computePackPatches } from "./packCollage";
import { MoodboardNode } from "../types";

const img = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
): MoodboardNode => ({
  id,
  kind: "image",
  parentId: null,
  x,
  y,
  width,
  height,
  rotation: 0,
  zIndex: 0,
  src: "",
  mediaId: null,
  naturalW: width,
  naturalH: height,
});

describe("packCollage", () => {
  it("returns no patches for empty input", () => {
    const patches = computePackPatches([], { x: 0, y: 0, width: 800, height: 600 });
    expect(patches).toEqual([]);
  });

  it("packs three equal-aspect images into a single row that fills width with gaps", () => {
    const nodes = [
      img("a", 0, 0, 200, 200),
      img("b", 0, 0, 200, 200),
      img("c", 0, 0, 200, 200),
    ];
    const bounds = { x: 0, y: 0, width: 600, height: 400 };
    const patches = computePackPatches(nodes, bounds, { rowHeight: 180, gap: 8 });
    expect(patches.length).toBe(3);
    // All in one row → same y, identical heights, total widths + 2 gaps == bounds.width.
    const ys = patches.map((p) => p.patch.y!);
    expect(ys[0]).toBe(0);
    expect(ys.every((y) => y === ys[0])).toBe(true);
    const widths = patches.map((p) => p.patch.width!);
    const totalW = widths.reduce((a, b) => a + b, 0) + 2 * 8;
    expect(totalW).toBeCloseTo(600, 1);
    const heights = patches.map((p) => p.patch.height!);
    expect(heights.every((h) => Math.abs(h - heights[0]) < 1e-6)).toBe(true);
  });

  it("breaks into multiple rows when aspects sum exceeds target", () => {
    const wide = (id: string) => img(id, 0, 0, 400, 100); // aspect 4
    const nodes = [wide("a"), wide("b"), wide("c"), wide("d")];
    const bounds = { x: 0, y: 0, width: 400, height: 600 };
    const patches = computePackPatches(nodes, bounds, { rowHeight: 100, gap: 0 });
    const distinctYs = new Set(patches.map((p) => p.patch.y!));
    expect(distinctYs.size).toBeGreaterThan(1);
  });

  it("computeAABB returns null on empty and a tight box on inputs", () => {
    expect(computeAABB([])).toBeNull();
    const aabb = computeAABB([img("a", 10, 20, 100, 50), img("b", 60, 0, 80, 200)]);
    expect(aabb).toEqual({ x: 10, y: 0, width: 130, height: 200 });
  });
});
