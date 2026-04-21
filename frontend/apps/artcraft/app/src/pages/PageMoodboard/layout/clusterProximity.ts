import { MoodboardNode, Vec2 } from "../types";

const center = (n: MoodboardNode): Vec2 => ({
  x: n.x + n.width / 2,
  y: n.y + n.height / 2,
});

const median = (xs: number[]): number => {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

export const defaultEpsForNodes = (nodes: MoodboardNode[]): number => {
  if (nodes.length === 0) return 0;
  const dims = nodes.map((n) => Math.max(n.width, n.height));
  return median(dims) * 1.5;
};

// DBSCAN with minPts = 1 → equivalent to connected-components on the
// eps-graph. Every input node ends up in some cluster (no noise points).
export const clusterByProximity = (
  nodes: MoodboardNode[],
  eps?: number,
): MoodboardNode[][] => {
  if (nodes.length === 0) return [];
  const e = eps ?? defaultEpsForNodes(nodes);
  const e2 = e * e;
  const centers = nodes.map(center);
  const visited = new Array(nodes.length).fill(false);
  const clusters: MoodboardNode[][] = [];

  const neighbors = (i: number): number[] => {
    const ci = centers[i];
    const out: number[] = [];
    for (let j = 0; j < centers.length; j++) {
      if (j === i) continue;
      const dx = centers[j].x - ci.x;
      const dy = centers[j].y - ci.y;
      if (dx * dx + dy * dy <= e2) out.push(j);
    }
    return out;
  };

  for (let i = 0; i < nodes.length; i++) {
    if (visited[i]) continue;
    const cluster: MoodboardNode[] = [];
    const queue = [i];
    while (queue.length) {
      const idx = queue.shift()!;
      if (visited[idx]) continue;
      visited[idx] = true;
      cluster.push(nodes[idx]);
      for (const n of neighbors(idx)) {
        if (!visited[n]) queue.push(n);
      }
    }
    clusters.push(cluster);
  }
  return clusters;
};
