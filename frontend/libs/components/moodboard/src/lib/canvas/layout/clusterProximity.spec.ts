import {
  clusterByProximity,
  defaultEpsForNodes,
} from "./clusterProximity";
import { MoodboardNode } from "../types";

const node = (id: string, x: number, y: number, size = 50): MoodboardNode => ({
  id,
  kind: "image",
  parentId: null,
  x,
  y,
  width: size,
  height: size,
  rotation: 0,
  zIndex: 0,
  src: "",
  mediaId: null,
  naturalW: size,
  naturalH: size,
});

describe("clusterByProximity", () => {
  it("returns no clusters for empty input", () => {
    expect(clusterByProximity([])).toEqual([]);
  });

  it("groups close neighbors and separates far ones", () => {
    const nodes = [
      node("a", 0, 0, 50),
      node("b", 30, 30, 50),
      node("c", 1000, 1000, 50),
    ];
    const clusters = clusterByProximity(nodes, 100);
    expect(clusters.length).toBe(2);
    const sizes = clusters.map((c) => c.length).sort();
    expect(sizes).toEqual([1, 2]);
  });

  it("treats every input as a singleton when eps is tiny", () => {
    const nodes = [node("a", 0, 0), node("b", 5, 5), node("c", 10, 10)];
    const clusters = clusterByProximity(nodes, 0.0001);
    expect(clusters.length).toBe(3);
    expect(clusters.every((c) => c.length === 1)).toBe(true);
  });

  it("derives a positive default eps from median size", () => {
    const eps = defaultEpsForNodes([node("a", 0, 0, 100), node("b", 0, 0, 200)]);
    expect(eps).toBeGreaterThan(0);
  });
});
