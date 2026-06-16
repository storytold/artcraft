import { GridDensity } from "../boards/boardTypes";

export interface DensityConfig {
  targetColumnWidth: number;
  gap: number;
  minColumns: number;
  maxColumns: number;
}

// Density presets map to a target column width + gap. The masonry resolves the
// actual column count + width from the container, so these are targets not hard
// sizes (Savee-style adjustable density).
export const DENSITY_CONFIG: Record<GridDensity, DensityConfig> = {
  comfortable: { targetColumnWidth: 280, gap: 20, minColumns: 1, maxColumns: 8 },
  cozy: { targetColumnWidth: 216, gap: 14, minColumns: 1, maxColumns: 10 },
  compact: { targetColumnWidth: 164, gap: 10, minColumns: 2, maxColumns: 14 },
};

export const DENSITY_ORDER: GridDensity[] = ["compact", "cozy", "comfortable"];

export interface PositionedItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MasonryLayout {
  positions: PositionedItem[];
  byId: Record<string, PositionedItem>;
  totalHeight: number;
  columnWidth: number;
  columnCount: number;
}

const MIN_ITEM_HEIGHT = 48;

// Classic shortest-column masonry. Heights come from each item's deterministic
// `aspect`, so the full layout is known without measuring the DOM — which is
// exactly what lets the grid virtualize by slicing on y.
export const computeMasonryLayout = (
  items: Array<{ id: string; aspect: number }>,
  containerWidth: number,
  density: DensityConfig,
): MasonryLayout => {
  const usable = Math.max(containerWidth, density.targetColumnWidth);
  const rawColumns = Math.round(usable / (density.targetColumnWidth + density.gap));
  const columnCount = Math.min(
    density.maxColumns,
    Math.max(density.minColumns, rawColumns || 1),
  );
  const totalGap = density.gap * (columnCount - 1);
  const columnWidth = (usable - totalGap) / columnCount;

  const columnHeights = new Array<number>(columnCount).fill(0);
  const positions: PositionedItem[] = [];
  const byId: Record<string, PositionedItem> = {};

  for (const item of items) {
    let col = 0;
    for (let c = 1; c < columnCount; c++) {
      if (columnHeights[c] < columnHeights[col]) col = c;
    }
    // Guard against a non-finite aspect (a single NaN would poison totalHeight
    // and collapse the whole virtualized slice).
    const aspect = Number.isFinite(item.aspect) && item.aspect > 0 ? item.aspect : 1;
    const height = Math.max(columnWidth * aspect, MIN_ITEM_HEIGHT);
    const pos: PositionedItem = {
      id: item.id,
      x: col * (columnWidth + density.gap),
      y: columnHeights[col],
      width: columnWidth,
      height,
    };
    positions.push(pos);
    byId[item.id] = pos;
    columnHeights[col] = pos.y + height + density.gap;
  }

  const tallest = columnHeights.reduce((m, h) => Math.max(m, h), 0);
  return {
    positions,
    byId,
    totalHeight: Math.max(0, tallest - density.gap),
    columnWidth,
    columnCount,
  };
};

// ---------- sectioned layout ----------

export const SECTION_HEADER_HEIGHT = 48;
export const SECTION_BOTTOM_GAP = 20;

export interface SectionGroup {
  // null id = the ungrouped default flow.
  id: string | null;
  name: string;
  collapsed: boolean;
  items: Array<{ id: string; aspect: number }>;
}

export interface SectionBand {
  id: string | null;
  name: string;
  count: number;
  collapsed: boolean;
  // Absolute y (content space) of the header row's top edge.
  headerY: number;
}

export interface SectionedLayout extends MasonryLayout {
  bands: SectionBand[];
}

// Stacks a masonry per section within one content plane: a header band, then the
// section's (non-collapsed) masonry, then a gap, repeated. Positions are absolute
// in the shared content space — so virtualization, marquee hit-testing, and
// spatial keyboard nav all keep working over the flat `positions`/`byId`.
export const computeSectionedLayout = (
  groups: SectionGroup[],
  containerWidth: number,
  density: DensityConfig,
): SectionedLayout => {
  let cursorY = 0;
  const positions: PositionedItem[] = [];
  const byId: Record<string, PositionedItem> = {};
  const bands: SectionBand[] = [];
  let columnWidth = 0;
  let columnCount = 0;

  for (const group of groups) {
    bands.push({
      id: group.id,
      name: group.name,
      count: group.items.length,
      collapsed: group.collapsed,
      headerY: cursorY,
    });
    cursorY += SECTION_HEADER_HEIGHT;

    if (!group.collapsed && group.items.length > 0) {
      const sub = computeMasonryLayout(group.items, containerWidth, density);
      columnWidth = sub.columnWidth;
      columnCount = sub.columnCount;
      for (const p of sub.positions) {
        const moved: PositionedItem = { ...p, y: p.y + cursorY };
        positions.push(moved);
        byId[p.id] = moved;
      }
      cursorY += sub.totalHeight;
    }
    cursorY += SECTION_BOTTOM_GAP;
  }

  return {
    positions,
    byId,
    bands,
    totalHeight: Math.max(0, cursorY - SECTION_BOTTOM_GAP),
    columnWidth,
    columnCount,
  };
};

export type NavDirection = "up" | "down" | "left" | "right";

// Spatial navigation: the nearest card to `fromId` in a direction, biased toward
// staying in the same row/column (cross-axis distance weighted more). Used for
// arrow-key focus movement across the masonry.
export const nearestInDirection = (
  byId: Record<string, PositionedItem>,
  fromId: string,
  dir: NavDirection,
): string | null => {
  const from = byId[fromId];
  if (!from) return null;
  const fcx = from.x + from.width / 2;
  const fcy = from.y + from.height / 2;
  let best: string | null = null;
  let bestScore = Infinity;
  for (const p of Object.values(byId)) {
    if (p.id === fromId) continue;
    const cx = p.x + p.width / 2;
    const cy = p.y + p.height / 2;
    const dx = cx - fcx;
    const dy = cy - fcy;
    let primary: number;
    let cross: number;
    if (dir === "right") {
      if (dx <= 1) continue;
      primary = dx;
      cross = Math.abs(dy);
    } else if (dir === "left") {
      if (dx >= -1) continue;
      primary = -dx;
      cross = Math.abs(dy);
    } else if (dir === "down") {
      if (dy <= 1) continue;
      primary = dy;
      cross = Math.abs(dx);
    } else {
      if (dy >= -1) continue;
      primary = -dy;
      cross = Math.abs(dx);
    }
    const score = primary + cross * 2;
    if (score < bestScore) {
      bestScore = score;
      best = p.id;
    }
  }
  return best;
};

// Returns only positions intersecting the scroll viewport (± buffer). Linear
// scan is fine to ~thousands of items; positions are already y-ordered enough
// for the predicate to be cheap.
export const sliceVisible = (
  positions: PositionedItem[],
  scrollTop: number,
  viewportHeight: number,
  buffer: number,
): PositionedItem[] => {
  const top = scrollTop - buffer;
  const bottom = scrollTop + viewportHeight + buffer;
  return positions.filter((p) => p.y + p.height >= top && p.y <= bottom);
};
