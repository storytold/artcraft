import { useMemo } from "react";
import Konva from "konva";
import { useMoodboardStore } from "../MoodboardStore";
import { computeSnap, SnapBox } from "../layout/snapping";

// Screen-space snap radius; divided by zoom so the feel is constant at any zoom.
const SNAP_SCREEN_PX = 6;

export interface NodeDragHandlers {
  onDragStart: () => void;
  onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

// Shared drag wiring for every canvas node. onDragStart snapshots history;
// onDragMove snaps the live position to nearby node edges/centers + the grid and
// publishes alignment guides; onDragEnd commits the final position and clears
// the guides. Reads the store imperatively inside handlers so the hook itself
// doesn't re-render on every node move.
export const useNodeDrag = (nodeId: string): NodeDragHandlers => {
  const updateNode = useMoodboardStore((s) => s.updateNode);
  const pushHistory = useMoodboardStore((s) => s.pushHistory);
  const setGuides = useMoodboardStore((s) => s.setGuides);

  return useMemo(
    () => ({
      onDragStart: () => pushHistory(),
      onDragMove: (e) => {
        const target = e.target;
        const state = useMoodboardStore.getState();
        if (!state.snapEnabled) return;
        const node = state.nodes[nodeId];
        if (!node) return;

        const box: SnapBox = {
          x: target.x(),
          y: target.y(),
          width: node.width,
          height: node.height,
        };
        const others: SnapBox[] = [];
        for (const id of state.rootOrder) {
          if (id === nodeId) continue;
          const n = state.nodes[id];
          if (n) others.push({ x: n.x, y: n.y, width: n.width, height: n.height });
        }

        const threshold = SNAP_SCREEN_PX / state.viewport.zoom;
        const result = computeSnap(box, others, threshold, state.gridSpacing);
        target.x(result.x);
        target.y(result.y);
        setGuides(result.guides);
      },
      onDragEnd: (e) => {
        updateNode(nodeId, { x: e.target.x(), y: e.target.y() });
        setGuides([]);
      },
    }),
    [nodeId, updateNode, pushHistory, setGuides],
  );
};
