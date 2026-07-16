import type { Board, BoardItem, BoardSection } from "../boards/boardTypes";
import type { MoodboardNode } from "../canvas/types";
import type { CanvasSize, Viewport } from "../canvas/layout/geometry";

// The JSON document persisted per board (one mood_board project row on the
// backend). Bundles the durable grid model with the canvas state so a load
// restores the canvas exactly as it was left — nodes, pan, and zoom.

export interface MoodboardCanvasDocument {
  nodes: Record<string, MoodboardNode>;
  rootOrder: string[];
  viewport: Viewport;
  // Stage size at save time. Persisted for context but not re-applied on
  // load (the stage re-measures its container on mount).
  canvasSize: CanvasSize;
  gridSpacing: number;
  snapEnabled: boolean;
}

export interface MoodboardDocument {
  version: 1;
  board: {
    name: string;
    itemOrder: string[];
    items: Record<string, BoardItem>;
    sections: BoardSection[];
  };
  canvas: MoodboardCanvasDocument;
}

export const EMPTY_CANVAS_DOCUMENT: MoodboardCanvasDocument = {
  nodes: {},
  rootOrder: [],
  viewport: { zoom: 1, pan: { x: 0, y: 0 } },
  canvasSize: { width: 800, height: 600 },
  gridSpacing: 32,
  snapEnabled: true,
};

// Blob object URLs die with the page, so they can't be persisted:
//  - items/nodes with a mediaId keep their place with src cleared to "" —
//    the sync layer re-resolves the token to a CDN URL on load;
//  - tokenless blob items/nodes are dropped entirely (nothing could ever
//    display them again). Dropped canvas nodes are also pruned from
//    rootOrder and from group/card childIds.
export function serializeMoodboardDocument({
  board,
  canvas,
}: {
  board: Board;
  canvas: MoodboardCanvasDocument;
}): MoodboardDocument {
  return {
    version: 1,
    board: {
      name: board.name,
      ...persistableBoardContent(board),
      sections: board.sections,
    },
    canvas: persistableCanvas(canvas),
  };
}

export function deserializeMoodboardDocument(
  documentJson: string,
): MoodboardDocument | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(documentJson);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const document = parsed as MoodboardDocument;
  if (!document.board || typeof document.board !== "object") return null;
  return {
    version: 1,
    board: {
      name: document.board.name ?? "Untitled board",
      itemOrder: document.board.itemOrder ?? [],
      items: document.board.items ?? {},
      sections: document.board.sections ?? [],
    },
    canvas: {
      ...EMPTY_CANVAS_DOCUMENT,
      ...(document.canvas ?? {}),
    },
  };
}

// Media tokens whose display URL needs re-resolution after a load (src was a
// blob URL at save time and got cleared).
export function collectUnresolvedMediaTokens(
  document: MoodboardDocument,
): string[] {
  const tokens = new Set<string>();
  for (const item of Object.values(document.board.items)) {
    if (
      (item.kind === "image" || item.kind === "video") &&
      !item.src &&
      item.mediaId
    ) {
      tokens.add(item.mediaId);
    }
  }
  for (const node of Object.values(document.canvas.nodes)) {
    if (
      (node.kind === "image" || node.kind === "video") &&
      !node.src &&
      node.mediaId
    ) {
      tokens.add(node.mediaId);
    }
  }
  return Array.from(tokens);
}

// Patch resolved URLs back into a loaded document (in place on a copy).
export function applyResolvedMediaUrls(
  document: MoodboardDocument,
  urlByToken: Record<string, string>,
): MoodboardDocument {
  const items = { ...document.board.items };
  for (const [id, item] of Object.entries(items)) {
    if (
      (item.kind === "image" || item.kind === "video") &&
      !item.src &&
      item.mediaId &&
      urlByToken[item.mediaId]
    ) {
      items[id] = { ...item, src: urlByToken[item.mediaId] };
    }
  }
  const nodes = { ...document.canvas.nodes };
  for (const [id, node] of Object.entries(nodes)) {
    if (
      (node.kind === "image" || node.kind === "video") &&
      !node.src &&
      node.mediaId &&
      urlByToken[node.mediaId]
    ) {
      nodes[id] = { ...node, src: urlByToken[node.mediaId] };
    }
  }
  return {
    ...document,
    board: { ...document.board, items },
    canvas: { ...document.canvas, nodes },
  };
}

// ---------- helpers ----------

const isBlobUrl = (src: string): boolean => src.startsWith("blob:");

function persistableBoardContent(board: Board): {
  itemOrder: string[];
  items: Record<string, BoardItem>;
} {
  const items: Record<string, BoardItem> = {};
  for (const [id, item] of Object.entries(board.items)) {
    if (item.kind !== "image" && item.kind !== "video") {
      items[id] = item;
      continue;
    }
    if (!isBlobUrl(item.src)) {
      items[id] = item;
      continue;
    }
    if (item.mediaId) {
      items[id] = { ...item, src: "" };
    }
    // blob src without a token: dropped.
  }
  return {
    itemOrder: board.itemOrder.filter((id) => items[id]),
    items,
  };
}

function persistableCanvas(
  canvas: MoodboardCanvasDocument,
): MoodboardCanvasDocument {
  const nodes: Record<string, MoodboardNode> = {};
  const dropped = new Set<string>();

  for (const [id, node] of Object.entries(canvas.nodes)) {
    if (node.kind !== "image" && node.kind !== "video") {
      nodes[id] = node;
      continue;
    }
    if (!isBlobUrl(node.src)) {
      nodes[id] = node;
      continue;
    }
    if (node.mediaId) {
      nodes[id] = { ...node, src: "" };
    } else {
      dropped.add(id);
    }
  }

  // Prune dropped node ids from group/card membership.
  if (dropped.size > 0) {
    for (const [id, node] of Object.entries(nodes)) {
      if (node.kind === "group" || node.kind === "card") {
        const childIds = node.childIds.filter((child) => !dropped.has(child));
        if (childIds.length !== node.childIds.length) {
          nodes[id] = { ...node, childIds };
        }
      }
    }
  }

  return {
    nodes,
    rootOrder: canvas.rootOrder.filter((id) => nodes[id]),
    viewport: canvas.viewport,
    canvasSize: canvas.canvasSize,
    gridSpacing: canvas.gridSpacing,
    snapEnabled: canvas.snapEnabled,
  };
}
