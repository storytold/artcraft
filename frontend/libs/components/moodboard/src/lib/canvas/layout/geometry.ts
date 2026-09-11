import { MoodboardNode, Rect, Vec2 } from "../types";

export interface Viewport {
  zoom: number;
  pan: Vec2;
}

export interface CanvasSize {
  width: number;
  height: number;
}

// Global zoom clamps — shared by gesture handlers, fit-to-content, and any
// future minimap so the camera can never land outside a consistent range.
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 8;

// ---------- scalar + rect primitives ----------

export const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));

export const rectFromPoints = (a: Vec2, b: Vec2): Rect => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  width: Math.abs(b.x - a.x),
  height: Math.abs(b.y - a.y),
});

export const rectCorners = (r: {
  x: number;
  y: number;
  width: number;
  height: number;
}): Vec2[] => [
  { x: r.x, y: r.y },
  { x: r.x + r.width, y: r.y },
  { x: r.x + r.width, y: r.y + r.height },
  { x: r.x, y: r.y + r.height },
];

export const rectsIntersect = (a: Rect, b: Rect): boolean =>
  !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );

// ---------- AABB over a set of nodes ----------

export const computeAABB = (nodes: MoodboardNode[]): Rect | null => {
  if (nodes.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }
  if (!Number.isFinite(minX)) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

export const computeAABBById = (
  nodes: Record<string, MoodboardNode>,
  ids: string[],
): Rect | null => {
  const picked: MoodboardNode[] = [];
  for (const id of ids) {
    const n = nodes[id];
    if (n) picked.push(n);
  }
  return computeAABB(picked);
};

// AABB of every top-level node. Treats rotated nodes as their own
// (x, y, w, h) rect for simplicity — fine for "is content on screen?"
// checks and minimap overviews.
export const computeContentBounds = (
  nodes: Record<string, MoodboardNode>,
  rootOrder: string[],
): Rect | null => computeAABBById(nodes, rootOrder);

// ---------- viewport math ----------

// Visible stage-coord rect = what the camera currently sees.
// canvas_px = pan + stage_coord * zoom, so the visible stage region maps to
// (-pan / zoom) .. (-pan / zoom + canvas / zoom).
export const computeVisibleRect = (
  viewport: Viewport,
  canvas: CanvasSize,
): Rect => ({
  x: -viewport.pan.x / viewport.zoom,
  y: -viewport.pan.y / viewport.zoom,
  width: canvas.width / viewport.zoom,
  height: canvas.height / viewport.zoom,
});

// True if any top-level node's AABB intersects the visible viewport.
// Used by the recenter indicator; a minimap can use this to style the
// viewport rectangle differently when off-content.
export const anyContentVisible = (
  nodes: Record<string, MoodboardNode>,
  rootOrder: string[],
  viewport: Viewport,
  canvas: CanvasSize,
): boolean => {
  const visible = computeVisibleRect(viewport, canvas);
  for (const id of rootOrder) {
    const n = nodes[id];
    if (!n) continue;
    if (
      rectsIntersect(
        { x: n.x, y: n.y, width: n.width, height: n.height },
        visible,
      )
    ) {
      return true;
    }
  }
  return false;
};

// Returns the viewport that frames `bounds` inside `canvas` with `padding`
// screen pixels of margin on all sides, clamped to [ZOOM_MIN, ZOOM_MAX].
// Degenerate bounds (zero width/height) fall back to zoom=1 centered on
// the point.
export const fitViewportToBounds = (
  bounds: Rect,
  canvas: CanvasSize,
  padding: number,
): Viewport => {
  if (bounds.width <= 0 || bounds.height <= 0) {
    return {
      zoom: 1,
      pan: {
        x: canvas.width / 2 - bounds.x,
        y: canvas.height / 2 - bounds.y,
      },
    };
  }
  const availW = Math.max(canvas.width - 2 * padding, 1);
  const availH = Math.max(canvas.height - 2 * padding, 1);
  const zoom = clamp(
    Math.min(availW / bounds.width, availH / bounds.height),
    ZOOM_MIN,
    ZOOM_MAX,
  );
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  return {
    zoom,
    pan: {
      x: canvas.width / 2 - centerX * zoom,
      y: canvas.height / 2 - centerY * zoom,
    },
  };
};

// Returns the pan that centers the viewport on a given stage-coord point
// at the current zoom. Handy for minimap drag-to-navigate: stage point
// under the minimap cursor → pan such that it lands in the canvas center.
export const panToCenterOn = (
  stagePoint: Vec2,
  zoom: number,
  canvas: CanvasSize,
): Vec2 => ({
  x: canvas.width / 2 - stagePoint.x * zoom,
  y: canvas.height / 2 - stagePoint.y * zoom,
});
