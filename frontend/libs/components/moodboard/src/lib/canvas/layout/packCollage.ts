import { MoodboardNode, Rect } from "../types";
import { LayoutPatch } from "./fitToGrid";

export interface PackOptions {
  rowHeight: number;
  gap: number;
}

const DEFAULTS: PackOptions = { rowHeight: 180, gap: 8 };

export const computePackPatches = (
  nodes: MoodboardNode[],
  bounds: Rect,
  opts: Partial<PackOptions> = {},
): LayoutPatch[] => {
  const { rowHeight, gap } = { ...DEFAULTS, ...opts };
  if (nodes.length === 0 || bounds.width <= 0) return [];

  const aspects = nodes.map((n) =>
    n.height > 0 ? n.width / n.height : 1,
  );

  // Greedy row break: stop adding when summed aspect (at target rowHeight)
  // would overflow the bounds width including per-item gaps.
  type Row = { indices: number[]; aspectSum: number };
  const rows: Row[] = [];
  let current: Row = { indices: [], aspectSum: 0 };

  const targetAspect = bounds.width / rowHeight;

  for (let i = 0; i < nodes.length; i++) {
    const a = aspects[i];
    const projected = current.aspectSum + a;
    const projectedGapAspect =
      (current.indices.length * gap) / rowHeight;
    if (
      current.indices.length > 0 &&
      projected + projectedGapAspect >= targetAspect
    ) {
      rows.push(current);
      current = { indices: [], aspectSum: 0 };
    }
    current.indices.push(i);
    current.aspectSum += a;
  }
  if (current.indices.length > 0) rows.push(current);

  const patches: LayoutPatch[] = [];
  let y = bounds.y;

  rows.forEach((row, rowIdx) => {
    const isLast = rowIdx === rows.length - 1;
    const gapsTotal = (row.indices.length - 1) * gap;
    const availW = Math.max(1, bounds.width - gapsTotal);
    let rowH = availW / row.aspectSum;
    if (isLast && rowH > rowHeight * 1.5) {
      rowH = rowHeight;
    }
    let x = bounds.x;
    for (const i of row.indices) {
      const w = aspects[i] * rowH;
      patches.push({
        id: nodes[i].id,
        patch: { x, y, width: w, height: rowH, rotation: 0 },
      });
      x += w + gap;
    }
    y += rowH + gap;
  });

  return patches;
};
