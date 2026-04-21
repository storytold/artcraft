import { MoodboardNode } from "../types";

export interface LayoutPatch {
  id: string;
  patch: Partial<MoodboardNode>;
}

export const computeFitToGridPatches = (
  nodes: MoodboardNode[],
  gridSpacing: number,
): LayoutPatch[] => {
  if (gridSpacing <= 0) return [];
  const patches: LayoutPatch[] = [];
  for (const n of nodes) {
    if (n.parentId !== null) continue; // only snap top-level nodes
    const snappedX = Math.round(n.x / gridSpacing) * gridSpacing;
    const snappedY = Math.round(n.y / gridSpacing) * gridSpacing;
    if (snappedX !== n.x || snappedY !== n.y) {
      patches.push({ id: n.id, patch: { x: snappedX, y: snappedY } });
    }
  }
  return patches;
};
