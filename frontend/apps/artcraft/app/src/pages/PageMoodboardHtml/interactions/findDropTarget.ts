import { useMoodboardStore } from "../../PageMoodboard/MoodboardStore";
import { worldPointFromClient } from "./htmlStagePointer";

// Returns the id of the top-level node under the given client-space point, or
// null if the point is over bare canvas. Skips the dragged node, groups, and
// any nodes inside groups/cards.
//
// Used by node drag handlers on pointer-up to decide whether the release
// should either (a) form a new card with that target + the dragged node, or
// (b) append the dragged node to an existing card.
export const findDropTargetAt = (
  clientX: number,
  clientY: number,
  draggedId: string,
): string | null => {
  const container = document.querySelector<HTMLDivElement>(
    "[data-moodboard-html-stage]",
  );
  if (!container) return null;
  const { nodes, rootOrder, viewport } = useMoodboardStore.getState();
  const p = worldPointFromClient(container, clientX, clientY, viewport);
  if (!p) return null;
  // Iterate in reverse z-order so the topmost overlap wins.
  for (let i = rootOrder.length - 1; i >= 0; i--) {
    const id = rootOrder[i];
    if (id === draggedId) continue;
    const n = nodes[id];
    if (!n) continue;
    if (n.kind === "group") continue;
    if (
      p.x >= n.x &&
      p.x <= n.x + n.width &&
      p.y >= n.y &&
      p.y <= n.y + n.height
    ) {
      return id;
    }
  }
  return null;
};

// Applies the drop result: forms a new card (target is a regular node) or
// appends (target is already a card). Returns true if any mutation happened.
export const applyDropOnto = (
  draggedId: string,
  targetId: string,
): boolean => {
  const state = useMoodboardStore.getState();
  const target = state.nodes[targetId];
  if (!target) return false;
  if (target.kind === "card") {
    state.appendToCard(targetId, draggedId);
    return true;
  }
  if (target.kind === "image" || target.kind === "video" || target.kind === "text") {
    state.createCardFromDrop(draggedId, targetId);
    return true;
  }
  return false;
};

// Recomputes the hover target under the pointer and publishes the result to
// the store's transient `dragPreview` so overlay UI can react. Safe to call
// on every pointermove — the setter is a shallow equality in practice since
// we always emit a fresh object, but targets change rarely during a drag.
export const updateDragPreview = (
  clientX: number,
  clientY: number,
  draggedId: string,
): void => {
  const targetId = findDropTargetAt(clientX, clientY, draggedId);
  useMoodboardStore
    .getState()
    .setDragPreview({ draggedId, targetId });
};

export const clearDragPreview = (): void => {
  useMoodboardStore.getState().setDragPreview(null);
};
