// Drag snapping for the freeform canvas. A moving node's near/center/far edges
// align to the same edges of nearby nodes (and, as a fallback, the background
// grid). Pure + deterministic so it can be unit-tested without Konva.

export interface SnapBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnapGuide {
  axis: "x" | "y";
  // Stage coordinate of the guide line on its axis.
  pos: number;
  // Cross-axis extent the guide spans (so it visually connects the two nodes).
  from: number;
  to: number;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuide[];
}

// near edge, center, far edge — the three alignment anchors per axis.
const xAnchors = (b: SnapBox): number[] => [b.x, b.x + b.width / 2, b.x + b.width];
const yAnchors = (b: SnapBox): number[] => [b.y, b.y + b.height / 2, b.y + b.height];

// Snaps `moving` against `others` within `threshold` (stage units). `grid`, when
// set, snaps the top-left to the grid on any axis that found no node alignment.
export const computeSnap = (
  moving: SnapBox,
  others: SnapBox[],
  threshold: number,
  grid: number | null,
): SnapResult => {
  let bestDX = threshold + 1;
  let snapX: number | null = null;
  let alignX = 0;
  let otherX: SnapBox | null = null;

  let bestDY = threshold + 1;
  let snapY: number | null = null;
  let alignY = 0;
  let otherY: SnapBox | null = null;

  const mxs = xAnchors(moving);
  const mys = yAnchors(moving);

  for (const o of others) {
    for (const ox of xAnchors(o)) {
      for (const mx of mxs) {
        const d = Math.abs(ox - mx);
        if (d < bestDX) {
          bestDX = d;
          snapX = moving.x + (ox - mx);
          alignX = ox;
          otherX = o;
        }
      }
    }
    for (const oy of yAnchors(o)) {
      for (const my of mys) {
        const d = Math.abs(oy - my);
        if (d < bestDY) {
          bestDY = d;
          snapY = moving.y + (oy - my);
          alignY = oy;
          otherY = o;
        }
      }
    }
  }

  // Grid fallback per axis (no guide line — the dotted grid is the reference).
  if (snapX === null && grid) {
    const gx = Math.round(moving.x / grid) * grid;
    if (Math.abs(gx - moving.x) <= threshold) snapX = gx;
  }
  if (snapY === null && grid) {
    const gy = Math.round(moving.y / grid) * grid;
    if (Math.abs(gy - moving.y) <= threshold) snapY = gy;
  }

  const finalX = snapX ?? moving.x;
  const finalY = snapY ?? moving.y;
  const snapped: SnapBox = { ...moving, x: finalX, y: finalY };

  const guides: SnapGuide[] = [];
  if (otherX) {
    guides.push({
      axis: "x",
      pos: alignX,
      from: Math.min(snapped.y, otherX.y),
      to: Math.max(snapped.y + snapped.height, otherX.y + otherX.height),
    });
  }
  if (otherY) {
    guides.push({
      axis: "y",
      pos: alignY,
      from: Math.min(snapped.x, otherY.x),
      to: Math.max(snapped.x + snapped.width, otherY.x + otherY.width),
    });
  }

  return { x: finalX, y: finalY, guides };
};
