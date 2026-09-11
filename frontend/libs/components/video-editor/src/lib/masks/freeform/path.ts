import type { ElementBounds } from "../../preview/element-bounds";

export interface FreeformPathPoint {
  id: string;
  x: number;
  y: number;
  inX: number;
  inY: number;
  outX: number;
  outY: number;
}

function isFreeformPathPoint(value: unknown): value is FreeformPathPoint {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    "id" in value &&
    typeof value.id === "string" &&
    "x" in value &&
    typeof value.x === "number" &&
    "y" in value &&
    typeof value.y === "number" &&
    "inX" in value &&
    typeof value.inX === "number" &&
    "inY" in value &&
    typeof value.inY === "number" &&
    "outX" in value &&
    typeof value.outX === "number" &&
    "outY" in value &&
    typeof value.outY === "number"
  );
}

export function parseFreeformPath({
  path,
}: {
  path: string;
}): FreeformPathPoint[] {
  if (!path) {
    return [];
  }

  try {
    const parsed = JSON.parse(path);
    return Array.isArray(parsed) ? parsed.filter(isFreeformPathPoint) : [];
  } catch {
    return [];
  }
}

export function serializeFreeformPath({
  points,
}: {
  points: FreeformPathPoint[];
}): string {
  return JSON.stringify(points);
}

export function removeFreeformPathPoints({
  points,
  pointIds,
}: {
  points: FreeformPathPoint[];
  pointIds: string[];
}): FreeformPathPoint[] {
  if (pointIds.length === 0) {
    return points;
  }
  const pointIdsToRemove = new Set(pointIds);
  return points.filter((point) => !pointIdsToRemove.has(point.id));
}

export function getFreeformPathClosedStateAfterPointRemoval({
  wasClosed,
  remainingPointCount,
}: {
  wasClosed: boolean;
  remainingPointCount: number;
}): boolean {
  return wasClosed && remainingPointCount >= 3;
}

function rotatePoint({
  x,
  y,
  rotationDegrees,
}: {
  x: number;
  y: number;
  rotationDegrees: number;
}): { x: number; y: number } {
  const angleRad = (rotationDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

export function getFreeformCenterCanvasPoint({
  centerX,
  centerY,
  bounds,
}: {
  centerX: number;
  centerY: number;
  bounds: ElementBounds;
}): { x: number; y: number } {
  return {
    x: bounds.cx + centerX * bounds.width,
    y: bounds.cy + centerY * bounds.height,
  };
}

export function freeformLocalPointToCanvas({
  point,
  centerX,
  centerY,
  rotation,
  scale,
  bounds,
}: {
  point: { x: number; y: number };
  centerX: number;
  centerY: number;
  rotation: number;
  scale: number;
  bounds: ElementBounds;
}): { x: number; y: number } {
  const center = getFreeformCenterCanvasPoint({ centerX, centerY, bounds });
  const scaledLocal = {
    x: point.x * bounds.width * scale,
    y: point.y * bounds.height * scale,
  };
  const rotated = rotatePoint({
    x: scaledLocal.x,
    y: scaledLocal.y,
    rotationDegrees: rotation,
  });

  return {
    x: center.x + rotated.x,
    y: center.y + rotated.y,
  };
}

export function freeformCanvasPointToLocal({
  point,
  centerX,
  centerY,
  rotation,
  scale,
  bounds,
}: {
  point: { x: number; y: number };
  centerX: number;
  centerY: number;
  rotation: number;
  scale: number;
  bounds: ElementBounds;
}): { x: number; y: number } {
  const center = getFreeformCenterCanvasPoint({ centerX, centerY, bounds });
  const translated = {
    x: point.x - center.x,
    y: point.y - center.y,
  };
  const rotated = rotatePoint({
    x: translated.x,
    y: translated.y,
    rotationDegrees: -rotation,
  });

  return {
    x: bounds.width === 0 ? 0 : rotated.x / (bounds.width * scale),
    y: bounds.height === 0 ? 0 : rotated.y / (bounds.height * scale),
  };
}

export function getFreeformCanvasGeometry({
  points,
  centerX,
  centerY,
  rotation,
  scale,
  bounds,
}: {
  points: FreeformPathPoint[];
  centerX: number;
  centerY: number;
  rotation: number;
  scale: number;
  bounds: ElementBounds;
}) {
  const anchors = points.map((point) => ({
    id: point.id,
    anchor: freeformLocalPointToCanvas({
      point: { x: point.x, y: point.y },
      centerX,
      centerY,
      rotation,
      scale,
      bounds,
    }),
    inHandle: freeformLocalPointToCanvas({
      point: { x: point.x + point.inX, y: point.y + point.inY },
      centerX,
      centerY,
      rotation,
      scale,
      bounds,
    }),
    outHandle: freeformLocalPointToCanvas({
      point: { x: point.x + point.outX, y: point.y + point.outY },
      centerX,
      centerY,
      rotation,
      scale,
      bounds,
    }),
  }));

  const geometryPoints = anchors.flatMap((point) => [
    point.anchor,
    point.inHandle,
    point.outHandle,
  ]);
  if (geometryPoints.length === 0) {
    return {
      anchors,
      bounds: null,
    };
  }

  const geometryBounds = getCanvasPointBounds({
    points: geometryPoints,
  });

  return {
    anchors,
    bounds: geometryBounds,
  };
}

export interface CanvasPoint {
  x: number;
  y: number;
}

function getCanvasPointBounds({ points }: { points: CanvasPoint[] }): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
} | null {
  if (points.length === 0) {
    return null;
  }

  const [firstPoint, ...restPoints] = points;
  let minX = firstPoint.x;
  let maxX = firstPoint.x;
  let minY = firstPoint.y;
  let maxY = firstPoint.y;

  for (const point of restPoints) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

export interface FreeformCanvasSegment {
  index: number;
  startPointId: string;
  endPointId: string;
  start: CanvasPoint;
  startOut: CanvasPoint;
  endIn: CanvasPoint;
  end: CanvasPoint;
  pathData: string;
}

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function getDistanceSquared({
  a,
  b,
}: {
  a: CanvasPoint;
  b: CanvasPoint;
}): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function lerpPoint({
  a,
  b,
  t,
}: {
  a: CanvasPoint;
  b: CanvasPoint;
  t: number;
}): CanvasPoint {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

function evaluateCubicBezier({
  p0,
  p1,
  p2,
  p3,
  t,
}: {
  p0: CanvasPoint;
  p1: CanvasPoint;
  p2: CanvasPoint;
  p3: CanvasPoint;
  t: number;
}): CanvasPoint {
  const oneMinusT = 1 - t;
  return {
    x:
      oneMinusT ** 3 * p0.x +
      3 * oneMinusT ** 2 * t * p1.x +
      3 * oneMinusT * t ** 2 * p2.x +
      t ** 3 * p3.x,
    y:
      oneMinusT ** 3 * p0.y +
      3 * oneMinusT ** 2 * t * p1.y +
      3 * oneMinusT * t ** 2 * p2.y +
      t ** 3 * p3.y,
  };
}

function getFreeformSegmentIndices({
  points,
  segmentIndex,
  closed,
}: {
  points: FreeformPathPoint[];
  segmentIndex: number;
  closed: boolean;
}): { startIndex: number; endIndex: number } | null {
  const segmentCount = getFreeformSegmentCount({ points, closed });
  if (segmentIndex < 0 || segmentIndex >= segmentCount) {
    return null;
  }

  return {
    startIndex: segmentIndex,
    endIndex: (segmentIndex + 1) % points.length,
  };
}

export function getFreeformSegmentCount({
  points,
  closed,
}: {
  points: FreeformPathPoint[];
  closed: boolean;
}): number {
  if (points.length < 2) {
    return 0;
  }
  return closed ? points.length : points.length - 1;
}

export function getFreeformCanvasSegments({
  points,
  centerX,
  centerY,
  rotation,
  scale,
  bounds,
  closed,
}: {
  points: FreeformPathPoint[];
  centerX: number;
  centerY: number;
  rotation: number;
  scale: number;
  bounds: ElementBounds;
  closed: boolean;
}): FreeformCanvasSegment[] {
  const geometry = getFreeformCanvasGeometry({
    points,
    centerX,
    centerY,
    rotation,
    scale,
    bounds,
  });
  const segmentCount = getFreeformSegmentCount({ points, closed });

  return Array.from({ length: segmentCount }, (_, segmentIndex) => {
    const start = geometry.anchors[segmentIndex];
    const end = geometry.anchors[(segmentIndex + 1) % geometry.anchors.length];
    return {
      index: segmentIndex,
      startPointId: start.id,
      endPointId: end.id,
      start: start.anchor,
      startOut: start.outHandle,
      endIn: end.inHandle,
      end: end.anchor,
      pathData: `M ${start.anchor.x},${start.anchor.y} C ${start.outHandle.x},${start.outHandle.y} ${end.inHandle.x},${end.inHandle.y} ${end.anchor.x},${end.anchor.y}`,
    };
  });
}

export function findClosestPointOnFreeformSegment({
  points,
  segmentIndex,
  canvasPoint,
  centerX,
  centerY,
  rotation,
  scale,
  bounds,
  closed,
}: {
  points: FreeformPathPoint[];
  segmentIndex: number;
  canvasPoint: CanvasPoint;
  centerX: number;
  centerY: number;
  rotation: number;
  scale: number;
  bounds: ElementBounds;
  closed: boolean;
}): { t: number; point: CanvasPoint } | null {
  const segment = getFreeformCanvasSegments({
    points,
    centerX,
    centerY,
    rotation,
    scale,
    bounds,
    closed,
  }).find((candidate) => candidate.index === segmentIndex);
  if (!segment) {
    return null;
  }

  const sampleCount = 24;
  let bestT = 0;
  let bestDistanceSquared = getDistanceSquared({
    a: canvasPoint,
    b: segment.start,
  });

  for (let step = 0; step <= sampleCount; step++) {
    const t = step / sampleCount;
    const point = evaluateCubicBezier({
      p0: segment.start,
      p1: segment.startOut,
      p2: segment.endIn,
      p3: segment.end,
      t,
    });
    const distanceSquared = getDistanceSquared({ a: canvasPoint, b: point });
    if (distanceSquared < bestDistanceSquared) {
      bestDistanceSquared = distanceSquared;
      bestT = t;
    }
  }

  let searchStep = 1 / sampleCount;
  for (let iteration = 0; iteration < 8; iteration++) {
    const candidates = [bestT - searchStep, bestT, bestT + searchStep]
      .map(clampUnit)
      .map((t) => ({
        t,
        point: evaluateCubicBezier({
          p0: segment.start,
          p1: segment.startOut,
          p2: segment.endIn,
          p3: segment.end,
          t,
        }),
      }));
    for (const candidate of candidates) {
      const distanceSquared = getDistanceSquared({
        a: canvasPoint,
        b: candidate.point,
      });
      if (distanceSquared < bestDistanceSquared) {
        bestDistanceSquared = distanceSquared;
        bestT = candidate.t;
      }
    }
    searchStep /= 2;
  }

  const clampedT = Math.min(0.999, Math.max(0.001, bestT));
  return {
    t: clampedT,
    point: evaluateCubicBezier({
      p0: segment.start,
      p1: segment.startOut,
      p2: segment.endIn,
      p3: segment.end,
      t: clampedT,
    }),
  };
}

export function insertPointIntoFreeformSegment({
  points,
  segmentIndex,
  pointId,
  t,
  closed,
}: {
  points: FreeformPathPoint[];
  segmentIndex: number;
  pointId: string;
  t: number;
  closed: boolean;
}): FreeformPathPoint[] {
  const indices = getFreeformSegmentIndices({
    points,
    segmentIndex,
    closed,
  });
  if (!indices) {
    return points;
  }

  const startPoint = points[indices.startIndex];
  const endPoint = points[indices.endIndex];
  const clampedT = Math.min(0.999, Math.max(0.001, t));
  const p0 = { x: startPoint.x, y: startPoint.y };
  const p1 = {
    x: startPoint.x + startPoint.outX,
    y: startPoint.y + startPoint.outY,
  };
  const p2 = {
    x: endPoint.x + endPoint.inX,
    y: endPoint.y + endPoint.inY,
  };
  const p3 = { x: endPoint.x, y: endPoint.y };
  const p01 = lerpPoint({ a: p0, b: p1, t: clampedT });
  const p12 = lerpPoint({ a: p1, b: p2, t: clampedT });
  const p23 = lerpPoint({ a: p2, b: p3, t: clampedT });
  const p012 = lerpPoint({ a: p01, b: p12, t: clampedT });
  const p123 = lerpPoint({ a: p12, b: p23, t: clampedT });
  const splitPoint = lerpPoint({ a: p012, b: p123, t: clampedT });

  const nextPoints = [...points];
  nextPoints[indices.startIndex] = {
    ...startPoint,
    outX: p01.x - startPoint.x,
    outY: p01.y - startPoint.y,
  };
  nextPoints[indices.endIndex] = {
    ...endPoint,
    inX: p23.x - endPoint.x,
    inY: p23.y - endPoint.y,
  };
  nextPoints.splice(indices.endIndex, 0, {
    id: pointId,
    x: splitPoint.x,
    y: splitPoint.y,
    inX: p012.x - splitPoint.x,
    inY: p012.y - splitPoint.y,
    outX: p123.x - splitPoint.x,
    outY: p123.y - splitPoint.y,
  });
  return nextPoints;
}

export function getFreeformLocalBounds({
  points,
  bounds,
}: {
  points: FreeformPathPoint[];
  bounds: ElementBounds;
}) {
  if (points.length === 0) {
    return null;
  }

  const values = points.flatMap((point) => [
    { x: point.x * bounds.width, y: point.y * bounds.height },
    {
      x: (point.x + point.inX) * bounds.width,
      y: (point.y + point.inY) * bounds.height,
    },
    {
      x: (point.x + point.outX) * bounds.width,
      y: (point.y + point.outY) * bounds.height,
    },
  ]);

  const localBounds = getCanvasPointBounds({
    points: values,
  });
  if (!localBounds) {
    return null;
  }

  return {
    width: localBounds.width,
    height: localBounds.height,
  };
}

export function recenterFreeformPath({
  points,
  centerX,
  centerY,
  rotation,
  scale,
  bounds,
}: {
  points: FreeformPathPoint[];
  centerX: number;
  centerY: number;
  rotation: number;
  scale: number;
  bounds: ElementBounds;
}) {
  if (points.length === 0) {
    return { centerX, centerY, points };
  }

  const geometry = getFreeformCanvasGeometry({
    points,
    centerX,
    centerY,
    rotation,
    scale,
    bounds,
  });
  if (!geometry.bounds) {
    return { centerX, centerY, points };
  }

  const nextCenterCanvas = {
    x: geometry.bounds.centerX,
    y: geometry.bounds.centerY,
  };
  const nextCenterLocal = {
    x: bounds.width === 0 ? 0 : (nextCenterCanvas.x - bounds.cx) / bounds.width,
    y:
      bounds.height === 0
        ? 0
        : (nextCenterCanvas.y - bounds.cy) / bounds.height,
  };

  const nextPoints = geometry.anchors.map((point) => {
    const anchor = freeformCanvasPointToLocal({
      point: point.anchor,
      centerX: nextCenterLocal.x,
      centerY: nextCenterLocal.y,
      rotation,
      scale,
      bounds,
    });
    const inHandle = freeformCanvasPointToLocal({
      point: point.inHandle,
      centerX: nextCenterLocal.x,
      centerY: nextCenterLocal.y,
      rotation,
      scale,
      bounds,
    });
    const outHandle = freeformCanvasPointToLocal({
      point: point.outHandle,
      centerX: nextCenterLocal.x,
      centerY: nextCenterLocal.y,
      rotation,
      scale,
      bounds,
    });

    return {
      id: point.id,
      x: anchor.x,
      y: anchor.y,
      inX: inHandle.x - anchor.x,
      inY: inHandle.y - anchor.y,
      outX: outHandle.x - anchor.x,
      outY: outHandle.y - anchor.y,
    };
  });

  return {
    centerX: nextCenterLocal.x,
    centerY: nextCenterLocal.y,
    points: nextPoints,
  };
}

export function buildFreeformPath2D({
  points,
  centerX,
  centerY,
  rotation,
  scale,
  bounds,
  closed,
}: {
  points: FreeformPathPoint[];
  centerX: number;
  centerY: number;
  rotation: number;
  scale: number;
  bounds: ElementBounds;
  closed: boolean;
}): Path2D {
  const path = new Path2D();
  if (points.length === 0) {
    return path;
  }

  const geometry = getFreeformCanvasGeometry({
    points,
    centerX,
    centerY,
    rotation,
    scale,
    bounds,
  });
  const anchors = geometry.anchors;
  path.moveTo(anchors[0].anchor.x, anchors[0].anchor.y);

  for (let index = 1; index < anchors.length; index++) {
    const previous = anchors[index - 1];
    const current = anchors[index];
    path.bezierCurveTo(
      previous.outHandle.x,
      previous.outHandle.y,
      current.inHandle.x,
      current.inHandle.y,
      current.anchor.x,
      current.anchor.y,
    );
  }

  if (closed && anchors.length > 1) {
    const last = anchors[anchors.length - 1];
    const first = anchors[0];
    path.bezierCurveTo(
      last.outHandle.x,
      last.outHandle.y,
      first.inHandle.x,
      first.inHandle.y,
      first.anchor.x,
      first.anchor.y,
    );
    path.closePath();
  }

  return path;
}

export function buildFreeformSvgPath({
  points,
  centerX,
  centerY,
  rotation,
  scale,
  bounds,
  closed,
}: {
  points: FreeformPathPoint[];
  centerX: number;
  centerY: number;
  rotation: number;
  scale: number;
  bounds: ElementBounds;
  closed: boolean;
}): string {
  if (points.length === 0) {
    return "";
  }

  const geometry = getFreeformCanvasGeometry({
    points,
    centerX,
    centerY,
    rotation,
    scale,
    bounds,
  });
  const anchors = geometry.anchors;
  const segments = [`M ${anchors[0].anchor.x},${anchors[0].anchor.y}`];

  for (let index = 1; index < anchors.length; index++) {
    const previous = anchors[index - 1];
    const current = anchors[index];
    segments.push(
      `C ${previous.outHandle.x},${previous.outHandle.y} ${current.inHandle.x},${current.inHandle.y} ${current.anchor.x},${current.anchor.y}`,
    );
  }

  if (closed && anchors.length > 1) {
    const last = anchors[anchors.length - 1];
    const first = anchors[0];
    segments.push(
      `C ${last.outHandle.x},${last.outHandle.y} ${first.inHandle.x},${first.inHandle.y} ${first.anchor.x},${first.anchor.y}`,
    );
    segments.push("Z");
  }

  return segments.join(" ");
}
