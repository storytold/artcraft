import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import {
  CardNode,
  GroupNode,
  ImageNode,
  MoodboardNode,
  MoodboardSnapshot,
  Rect,
  TextNode,
  Tool,
  Vec2,
  VideoNode,
} from "./types";
import { useMoodboardHistoryStore } from "./MoodboardHistoryStore";
import {
  DEFAULT_CARD_COLOR,
  DEFAULT_CARD_PADDING,
  DEFAULT_CARD_WIDTH,
  computeCardHeight,
} from "./cardLayout";
import {
  CanvasSize,
  Viewport,
  computeAABBById,
  computeContentBounds,
  fitViewportToBounds,
} from "./layout/geometry";
import { SnapGuide } from "./layout/snapping";

// Hover state published during a node drag so overlay UI can highlight the card
// (or to-be card) the dragged node would land in. `targetId` is null when the
// pointer is over bare canvas.
export interface DragPreview {
  draggedId: string;
  targetId: string | null;
}

interface Transient {
  marquee: Rect | null;
  lassoPath: Vec2[] | null;
  editingTextId: string | null;
  isPanning: boolean;
  dragPreview: DragPreview | null;
  // Alignment guides shown live during a snapped drag.
  guides: SnapGuide[];
}

interface MoodboardState {
  nodes: Record<string, MoodboardNode>;
  rootOrder: string[];
  selectedIds: Set<string>;
  tool: Tool;
  gridSpacing: number;
  // Snap a dragged node to nearby node edges/centers + the grid.
  snapEnabled: boolean;
  lastDropPoint: Vec2;
  viewport: Viewport;
  canvasSize: CanvasSize;
  transient: Transient;

  setTool: (t: Tool) => void;
  toggleSnap: () => void;
  setGuides: (guides: SnapGuide[]) => void;
  setLastDropPoint: (p: Vec2) => void;
  setZoom: (z: number) => void;
  setPan: (p: Vec2) => void;
  setCanvasSize: (s: CanvasSize) => void;
  resetViewport: () => void;
  fitToContent: (padding?: number) => void;
  selectAll: () => void;

  addImage: (
    src: string,
    pos: Vec2,
    naturalW: number,
    naturalH: number,
    mediaId?: string | null,
  ) => string;
  addVideo: (
    src: string,
    pos: Vec2,
    naturalW: number,
    naturalH: number,
    mediaId?: string | null,
  ) => string;
  addText: (pos: Vec2) => string;
  updateNode: (id: string, patch: Partial<MoodboardNode>) => void;
  setCardColor: (id: string, color: string) => void;
  deleteSelected: () => void;
  applyLayoutPatches: (
    patches: Array<{ id: string; patch: Partial<MoodboardNode> }>,
  ) => void;

  setSelection: (ids: Iterable<string>) => void;
  toggleInSelection: (id: string, additive: boolean) => void;
  clearSelection: () => void;

  group: () => string | null;
  ungroup: () => void;
  // Atomic multi-cluster grouping for "auto-group by proximity": creates one
  // group per provided cluster of ids, with a single history entry covering
  // all of them. Returns the new group ids.
  groupClusters: (clusters: string[][]) => string[];

  // Card stacking (drag-onto-node gesture). `createCardFromDrop` forms a new
  // card from a bare target node plus the dragged node; `appendToCard` adds the
  // dragged node into an existing card. Both remove the dragged node from the
  // root and reflow the card's height.
  createCardFromDrop: (draggedId: string, targetId: string) => string | null;
  appendToCard: (cardId: string, draggedId: string) => void;

  setMarquee: (r: Rect | null) => void;
  setLassoPath: (p: Vec2[] | null) => void;
  setEditingText: (id: string | null) => void;
  setIsPanning: (v: boolean) => void;
  setDragPreview: (p: DragPreview | null) => void;

  // Snapshot helpers used by history wiring (do NOT push to history themselves).
  snapshot: () => MoodboardSnapshot;
  applySnapshot: (snap: MoodboardSnapshot) => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  reset: () => void;
}

const DEFAULT_TEXT_W = 200;
const DEFAULT_TEXT_H = 60;
const DEFAULT_FONT_SIZE = 24;
const DEFAULT_TEXT_COLOR = "#FFFFFF";
const MAX_IMAGE_DIMENSION = 480;

const fitWithinBox = (w: number, h: number, max: number): { w: number; h: number } => {
  if (w <= max && h <= max) return { w, h };
  const ratio = Math.min(max / w, max / h);
  return { w: w * ratio, h: h * ratio };
};

export const useMoodboardStore = create<MoodboardState>((set, get) => ({
  nodes: {},
  rootOrder: [],
  selectedIds: new Set(),
  tool: "select",
  gridSpacing: 32,
  snapEnabled: true,
  lastDropPoint: { x: 200, y: 200 },
  viewport: { zoom: 1, pan: { x: 0, y: 0 } },
  canvasSize: { width: 800, height: 600 },
  transient: {
    marquee: null,
    lassoPath: null,
    editingTextId: null,
    isPanning: false,
    dragPreview: null,
    guides: [],
  },

  setTool: (t) => set({ tool: t }),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
  setGuides: (guides) =>
    set((s) => ({ transient: { ...s.transient, guides } })),
  setLastDropPoint: (p) => set({ lastDropPoint: p }),
  setZoom: (z) => set((s) => ({ viewport: { ...s.viewport, zoom: z } })),
  setPan: (p) => set((s) => ({ viewport: { ...s.viewport, pan: p } })),
  setCanvasSize: (sz) => set({ canvasSize: sz }),
  resetViewport: () =>
    set({ viewport: { zoom: 1, pan: { x: 0, y: 0 } } }),
  fitToContent: (padding = 48) => {
    const { nodes, rootOrder, canvasSize } = get();
    const bounds = computeContentBounds(nodes, rootOrder);
    if (!bounds) return;
    set({ viewport: fitViewportToBounds(bounds, canvasSize, padding) });
  },
  selectAll: () => {
    const { rootOrder } = get();
    if (rootOrder.length === 0) return;
    set({ selectedIds: new Set(rootOrder) });
  },

  addImage: (src, pos, naturalW, naturalH, mediaId = null) => {
    get().pushHistory();
    const id = uuidv4();
    const fit = fitWithinBox(naturalW || 320, naturalH || 320, MAX_IMAGE_DIMENSION);
    const node: ImageNode = {
      id,
      kind: "image",
      parentId: null,
      x: pos.x - fit.w / 2,
      y: pos.y - fit.h / 2,
      width: fit.w,
      height: fit.h,
      rotation: 0,
      zIndex: get().rootOrder.length,
      src,
      mediaId,
      naturalW,
      naturalH,
    };
    set((s) => ({
      nodes: { ...s.nodes, [id]: node },
      rootOrder: [...s.rootOrder, id],
      selectedIds: new Set([id]),
    }));
    return id;
  },

  addVideo: (src, pos, naturalW, naturalH, mediaId = null) => {
    get().pushHistory();
    const id = uuidv4();
    const fit = fitWithinBox(naturalW || 320, naturalH || 320, MAX_IMAGE_DIMENSION);
    const node: VideoNode = {
      id,
      kind: "video",
      parentId: null,
      x: pos.x - fit.w / 2,
      y: pos.y - fit.h / 2,
      width: fit.w,
      height: fit.h,
      rotation: 0,
      zIndex: get().rootOrder.length,
      src,
      mediaId,
      naturalW,
      naturalH,
      // Silent looping autoplay is the Milanote-style default — browsers
      // only permit autoplay when muted, so these three travel together.
      muted: true,
      loop: true,
      autoplay: true,
    };
    set((s) => ({
      nodes: { ...s.nodes, [id]: node },
      rootOrder: [...s.rootOrder, id],
      selectedIds: new Set([id]),
    }));
    return id;
  },

  addText: (pos) => {
    get().pushHistory();
    const id = uuidv4();
    const node: TextNode = {
      id,
      kind: "text",
      parentId: null,
      x: pos.x - DEFAULT_TEXT_W / 2,
      y: pos.y - DEFAULT_TEXT_H / 2,
      width: DEFAULT_TEXT_W,
      height: DEFAULT_TEXT_H,
      rotation: 0,
      zIndex: get().rootOrder.length,
      text: "Note",
      fontSize: DEFAULT_FONT_SIZE,
      color: DEFAULT_TEXT_COLOR,
    };
    set((s) => ({
      nodes: { ...s.nodes, [id]: node },
      rootOrder: [...s.rootOrder, id],
      selectedIds: new Set([id]),
      transient: { ...s.transient, editingTextId: id },
    }));
    return id;
  },

  updateNode: (id, patch) => {
    set((s) => {
      const existing = s.nodes[id];
      if (!existing) return s;
      // Keep discriminant intact by spreading then overlaying with patch fields.
      const merged = { ...existing, ...patch } as MoodboardNode;
      return { nodes: { ...s.nodes, [id]: merged } };
    });
  },

  setCardColor: (id, color) => {
    // Live edit (called continuously while dragging the color picker), so it
    // deliberately skips history — the undo stack would otherwise flood with a
    // frame per pointermove.
    set((s) => {
      const n = s.nodes[id];
      if (!n || n.kind !== "card") return s;
      return { nodes: { ...s.nodes, [id]: { ...n, backgroundColor: color } } };
    });
  },

  deleteSelected: () => {
    const { selectedIds } = get();
    if (selectedIds.size === 0) return;
    get().pushHistory();
    set((s) => {
      const removed = new Set<string>();
      const collect = (id: string) => {
        const n = s.nodes[id];
        if (!n) return;
        removed.add(id);
        if (n.kind === "group" || n.kind === "card") n.childIds.forEach(collect);
      };
      selectedIds.forEach(collect);

      const nodes: Record<string, MoodboardNode> = {};
      Object.entries(s.nodes).forEach(([id, n]) => {
        if (removed.has(id)) return;
        // Filter dangling child references in container nodes.
        if (n.kind === "group" || n.kind === "card") {
          nodes[id] = {
            ...n,
            childIds: n.childIds.filter((c) => !removed.has(c)),
          };
        } else {
          nodes[id] = n;
        }
      });

      return {
        nodes,
        rootOrder: s.rootOrder.filter((id) => !removed.has(id)),
        selectedIds: new Set(),
      };
    });
  },

  applyLayoutPatches: (patches) => {
    if (patches.length === 0) return;
    get().pushHistory();
    set((s) => {
      const nodes = { ...s.nodes };
      patches.forEach(({ id, patch }) => {
        const existing = nodes[id];
        if (!existing) return;
        nodes[id] = { ...existing, ...patch } as MoodboardNode;
      });
      return { nodes };
    });
  },

  setSelection: (ids) => {
    set({ selectedIds: stripAncestorsAndDescendants(get().nodes, new Set(ids)) });
  },

  toggleInSelection: (id, additive) => {
    set((s) => {
      const next = additive ? new Set(s.selectedIds) : new Set<string>();
      if (additive && s.selectedIds.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedIds: stripAncestorsAndDescendants(s.nodes, next) };
    });
  },

  clearSelection: () => set({ selectedIds: new Set() }),

  group: () => {
    const { selectedIds, nodes } = get();
    const topLevelIds = Array.from(selectedIds).filter((id) => {
      const n = nodes[id];
      return n && n.parentId === null;
    });
    if (topLevelIds.length < 2) return null;

    get().pushHistory();
    const groupId = uuidv4();

    const aabb = computeAABBById(nodes, topLevelIds);
    if (!aabb) return null;

    const groupNode: GroupNode = {
      id: groupId,
      kind: "group",
      parentId: null,
      x: aabb.x,
      y: aabb.y,
      width: aabb.width,
      height: aabb.height,
      rotation: 0,
      zIndex: get().rootOrder.length,
      childIds: topLevelIds,
    };

    set((s) => {
      const newNodes: Record<string, MoodboardNode> = { ...s.nodes };
      // Rebase each child position to be group-local.
      topLevelIds.forEach((id) => {
        const n = newNodes[id];
        if (!n) return;
        newNodes[id] = {
          ...n,
          parentId: groupId,
          x: n.x - aabb.x,
          y: n.y - aabb.y,
        } as MoodboardNode;
      });
      newNodes[groupId] = groupNode;
      return {
        nodes: newNodes,
        rootOrder: [
          ...s.rootOrder.filter((id) => !topLevelIds.includes(id)),
          groupId,
        ],
        selectedIds: new Set([groupId]),
      };
    });
    return groupId;
  },

  groupClusters: (clusters) => {
    // Single-shot atomic version of group() that creates one group per
    // cluster of ids, with one history entry covering all of them. Used by
    // "Auto-group by proximity" so undo collapses to a single step.
    const validClusters = clusters.filter((cluster) => cluster.length >= 2);
    if (validClusters.length === 0) return [];
    get().pushHistory();
    const newGroupIds: string[] = [];
    set((s) => {
      const newNodes: Record<string, MoodboardNode> = { ...s.nodes };
      let newRootOrder = [...s.rootOrder];
      for (const cluster of validClusters) {
        const topLevelIds = cluster.filter((id) => {
          const n = newNodes[id];
          return n && n.parentId === null;
        });
        if (topLevelIds.length < 2) continue;
        const aabb = computeAABBById(newNodes, topLevelIds);
        if (!aabb) continue;
        const groupId = uuidv4();
        const groupNode: GroupNode = {
          id: groupId,
          kind: "group",
          parentId: null,
          x: aabb.x,
          y: aabb.y,
          width: aabb.width,
          height: aabb.height,
          rotation: 0,
          zIndex: newRootOrder.length,
          childIds: topLevelIds,
        };
        topLevelIds.forEach((id) => {
          const n = newNodes[id];
          if (!n) return;
          newNodes[id] = {
            ...n,
            parentId: groupId,
            x: n.x - aabb.x,
            y: n.y - aabb.y,
          } as MoodboardNode;
        });
        newNodes[groupId] = groupNode;
        newRootOrder = [
          ...newRootOrder.filter((id) => !topLevelIds.includes(id)),
          groupId,
        ];
        newGroupIds.push(groupId);
      }
      return {
        nodes: newNodes,
        rootOrder: newRootOrder,
        selectedIds: new Set(newGroupIds),
      };
    });
    return newGroupIds;
  },

  createCardFromDrop: (draggedId, targetId) => {
    const { nodes } = get();
    const dragged = nodes[draggedId];
    const target = nodes[targetId];
    if (!dragged || !target || draggedId === targetId) return null;
    // If the target is already a card, this is really an append.
    if (target.kind === "card") {
      get().appendToCard(targetId, draggedId);
      return targetId;
    }
    // Only top-level bare nodes can seed a new card.
    if (target.parentId !== null || dragged.parentId !== null) return null;

    get().pushHistory();
    const cardId = uuidv4();
    // Target was there first, so it sits on top; the dragged node stacks below.
    const childIds = [targetId, draggedId];

    set((s) => {
      const newNodes: Record<string, MoodboardNode> = { ...s.nodes };
      childIds.forEach((cid) => {
        const c = newNodes[cid];
        if (!c) return;
        // Children are reparented; their x/y are ignored by the card's flex
        // layout, so we leave them as-is to make ungrouping cheap later.
        newNodes[cid] = { ...c, parentId: cardId } as MoodboardNode;
      });
      const base: CardNode = {
        id: cardId,
        kind: "card",
        parentId: null,
        x: target.x,
        y: target.y,
        width: DEFAULT_CARD_WIDTH,
        height: 0,
        rotation: 0,
        zIndex: s.rootOrder.length,
        childIds,
        padding: DEFAULT_CARD_PADDING,
        backgroundColor: DEFAULT_CARD_COLOR,
      };
      newNodes[cardId] = { ...base, height: computeCardHeight(base, newNodes) };
      return {
        nodes: newNodes,
        rootOrder: [
          ...s.rootOrder.filter((id) => id !== targetId && id !== draggedId),
          cardId,
        ],
        selectedIds: new Set([cardId]),
      };
    });
    return cardId;
  },

  appendToCard: (cardId, draggedId) => {
    const { nodes } = get();
    const card = nodes[cardId];
    const dragged = nodes[draggedId];
    if (!card || card.kind !== "card" || !dragged) return;
    if (draggedId === cardId || card.childIds.includes(draggedId)) return;

    get().pushHistory();
    set((s) => {
      const current = s.nodes[cardId];
      const child = s.nodes[draggedId];
      if (!current || current.kind !== "card" || !child) return s;
      const newNodes: Record<string, MoodboardNode> = { ...s.nodes };
      newNodes[draggedId] = { ...child, parentId: cardId } as MoodboardNode;
      const base: CardNode = {
        ...current,
        childIds: [...current.childIds, draggedId],
      };
      newNodes[cardId] = { ...base, height: computeCardHeight(base, newNodes) };
      return {
        nodes: newNodes,
        rootOrder: s.rootOrder.filter((id) => id !== draggedId),
        selectedIds: new Set([cardId]),
      };
    });
  },

  ungroup: () => {
    const { selectedIds, nodes } = get();
    const groupIds = Array.from(selectedIds).filter(
      (id) => nodes[id]?.kind === "group",
    );
    if (groupIds.length === 0) return;

    get().pushHistory();

    set((s) => {
      const newNodes: Record<string, MoodboardNode> = { ...s.nodes };
      const newRootOrder = [...s.rootOrder];
      const releasedChildIds: string[] = [];

      groupIds.forEach((gid) => {
        const g = newNodes[gid];
        if (!g || g.kind !== "group") return;
        // Rebase children back to stage-local using group's transform.
        g.childIds.forEach((cid) => {
          const child = newNodes[cid];
          if (!child) return;
          const local = { x: child.x, y: child.y };
          const stagePoint = applyGroupTransform(local, g);
          newNodes[cid] = {
            ...child,
            parentId: null,
            x: stagePoint.x,
            y: stagePoint.y,
            // Carry the group's rotation onto the child so the visual stays put.
            rotation: child.rotation + g.rotation,
          } as MoodboardNode;
          releasedChildIds.push(cid);
        });
        delete newNodes[gid];
        const idx = newRootOrder.indexOf(gid);
        if (idx >= 0) newRootOrder.splice(idx, 1);
      });

      releasedChildIds.forEach((cid) => newRootOrder.push(cid));

      return {
        nodes: newNodes,
        rootOrder: newRootOrder,
        selectedIds: new Set(releasedChildIds),
      };
    });
  },

  setMarquee: (r) =>
    set((s) => ({ transient: { ...s.transient, marquee: r } })),
  setLassoPath: (p) =>
    set((s) => ({ transient: { ...s.transient, lassoPath: p } })),
  setEditingText: (id) =>
    set((s) => ({ transient: { ...s.transient, editingTextId: id } })),
  setIsPanning: (v) =>
    set((s) => ({ transient: { ...s.transient, isPanning: v } })),
  setDragPreview: (p) =>
    set((s) => ({ transient: { ...s.transient, dragPreview: p } })),

  snapshot: () => {
    const { nodes, rootOrder, selectedIds } = get();
    return {
      nodes: structuredClone(nodes),
      rootOrder: [...rootOrder],
      selectedIds: Array.from(selectedIds),
    };
  },

  applySnapshot: (snap) => {
    set({
      nodes: structuredClone(snap.nodes),
      rootOrder: [...snap.rootOrder],
      selectedIds: new Set(snap.selectedIds),
    });
  },

  pushHistory: () => {
    useMoodboardHistoryStore.getState().push(get().snapshot());
  },

  undo: () => {
    const current = get().snapshot();
    const prior = useMoodboardHistoryStore.getState().undo(current);
    if (prior) get().applySnapshot(prior);
  },

  redo: () => {
    const current = get().snapshot();
    const next = useMoodboardHistoryStore.getState().redo(current);
    if (next) get().applySnapshot(next);
  },

  reset: () => {
    useMoodboardHistoryStore.getState().clear();
    set({
      nodes: {},
      rootOrder: [],
      selectedIds: new Set(),
      tool: "select",
      lastDropPoint: { x: 200, y: 200 },
      viewport: { zoom: 1, pan: { x: 0, y: 0 } },
      transient: {
        marquee: null,
        lassoPath: null,
        editingTextId: null,
        isPanning: false,
        dragPreview: null,
        guides: [],
      },
    });
  },
}));

// ---------- helpers ----------

const stripAncestorsAndDescendants = (
  nodes: Record<string, MoodboardNode>,
  ids: Set<string>,
): Set<string> => {
  const result = new Set(ids);
  // Drop any node whose ancestor (parent chain up to root) is in the set.
  ids.forEach((id) => {
    let cur = nodes[id];
    while (cur && cur.parentId) {
      if (result.has(cur.parentId)) {
        result.delete(id);
        break;
      }
      cur = nodes[cur.parentId];
    }
  });
  // Drop any descendant whose ancestor container (group or card) is in the set.
  ids.forEach((id) => {
    const n = nodes[id];
    if (n && (n.kind === "group" || n.kind === "card")) {
      const stack = [...n.childIds];
      while (stack.length) {
        const c = stack.pop()!;
        if (result.has(c)) result.delete(c);
        const cn = nodes[c];
        if (cn && (cn.kind === "group" || cn.kind === "card")) {
          stack.push(...cn.childIds);
        }
      }
    }
  });
  return result;
};

// Maps a group-local point to stage-local coords using the group's transform.
const applyGroupTransform = (local: Vec2, g: GroupNode): Vec2 => {
  const rad = (g.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: g.x + local.x * cos - local.y * sin,
    y: g.y + local.x * sin + local.y * cos,
  };
};
