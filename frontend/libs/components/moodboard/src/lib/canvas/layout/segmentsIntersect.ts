import { Vec2 } from "../types";

const cross = (ax: number, ay: number, bx: number, by: number) =>
  ax * by - ay * bx;

export const segmentsIntersect = (
  p1: Vec2,
  p2: Vec2,
  p3: Vec2,
  p4: Vec2,
): boolean => {
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x;
  const d2y = p4.y - p3.y;
  const denom = cross(d1x, d1y, d2x, d2y);
  if (denom === 0) return false; // parallel or collinear
  const dx = p3.x - p1.x;
  const dy = p3.y - p1.y;
  const t = cross(dx, dy, d2x, d2y) / denom;
  const u = cross(dx, dy, d1x, d1y) / denom;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
};

export const polygonIntersectsRect = (
  polygon: Vec2[],
  rect: { x: number; y: number; width: number; height: number },
): boolean => {
  if (polygon.length < 2) return false;
  const corners: Vec2[] = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    for (let j = 0; j < 4; j++) {
      const c = corners[j];
      const d = corners[(j + 1) % 4];
      if (segmentsIntersect(a, b, c, d)) return true;
    }
  }
  return false;
};
