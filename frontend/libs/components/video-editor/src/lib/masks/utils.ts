// Half-plane / segment-intersection helpers used by the split-mask
// geometry. `halfPlaneSign` returns the signed distance of a point
// from the half-plane defined by (lineX, lineY, normalX, normalY) —
// positive on the normal's side, negative on the other.
//
// `lineEdgeIntersection` finds where the cutting line crosses the
// segment (x1,y1)→(x2,y2). Returns null when the segment doesn't
// cross (the two endpoints share a sign), or when the line is
// numerically parallel to the segment.

const LINE_PARALLEL_EPSILON = 1e-10;

export function lineEdgeIntersection({
  lineX,
  lineY,
  normalX,
  normalY,
  x1,
  y1,
  x2,
  y2,
}: {
  lineX: number;
  lineY: number;
  normalX: number;
  normalY: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}): { x: number; y: number } | null {
  const distance1 = halfPlaneSign({
    lineX,
    lineY,
    normalX,
    normalY,
    x: x1,
    y: y1,
  });
  const distance2 = halfPlaneSign({
    lineX,
    lineY,
    normalX,
    normalY,
    x: x2,
    y: y2,
  });
  const denom = distance1 - distance2;
  if (Math.abs(denom) < LINE_PARALLEL_EPSILON) return null;
  const t = distance1 / denom;
  if (t < 0 || t > 1) return null;
  return {
    x: x1 + (x2 - x1) * t,
    y: y1 + (y2 - y1) * t,
  };
}

export function halfPlaneSign({
  lineX,
  lineY,
  normalX,
  normalY,
  x,
  y,
}: {
  lineX: number;
  lineY: number;
  normalX: number;
  normalY: number;
  x: number;
  y: number;
}): number {
  return (x - lineX) * normalX + (y - lineY) * normalY;
}
