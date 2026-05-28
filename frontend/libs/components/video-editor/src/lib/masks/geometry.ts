import type { ElementBounds } from "../preview/element-bounds";
import type { SnapLine } from "../preview/preview-snap";
import { MIN_MASK_DIMENSION } from "./dimensions";
import type { RectangleMaskParams } from "./types";

// Mask params are normalized (0..1) against the element's bounds. The
// helpers here translate between that normalized space (good for
// resolution-independent storage) and absolute pixel-space coordinates
// the snap engine needs.

type CenterMaskParams = {
  centerX: number;
  centerY: number;
};

type SnapGeometryParams = CenterMaskParams & {
  rotation?: number;
  width?: number;
  height?: number;
  scale?: number;
};

export function hasCenterParams(
  params: Partial<CenterMaskParams>,
): params is CenterMaskParams {
  return (
    typeof params.centerX === "number" && typeof params.centerY === "number"
  );
}

export function isRectangleMaskParams(
  params: SnapGeometryParams,
): params is RectangleMaskParams {
  return (
    hasCenterParams(params) &&
    typeof params.width === "number" &&
    typeof params.height === "number" &&
    typeof params.rotation === "number" &&
    typeof params.scale === "number"
  );
}

export function getMaskLocalCenter({
  params,
  bounds,
}: {
  params: CenterMaskParams;
  bounds: ElementBounds;
}): { x: number; y: number } | null {
  if (!hasCenterParams(params)) return null;

  return {
    x: params.centerX * bounds.width,
    y: params.centerY * bounds.height,
  };
}

export function setMaskLocalCenter({
  center,
  bounds,
}: {
  center: { x: number; y: number };
  bounds: ElementBounds;
}): { centerX: number; centerY: number } {
  return {
    centerX: bounds.width === 0 ? 0 : center.x / bounds.width,
    centerY: bounds.height === 0 ? 0 : center.y / bounds.height,
  };
}

export function getMaskSnapGeometry({
  params,
  bounds,
}: {
  params: SnapGeometryParams;
  bounds: ElementBounds;
}): {
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
} | null {
  const position = getMaskLocalCenter({ params, bounds });
  if (!position) return null;

  if (isRectangleMaskParams(params)) {
    return {
      position,
      size: {
        width: Math.max(params.width, MIN_MASK_DIMENSION) * bounds.width,
        height: Math.max(params.height, MIN_MASK_DIMENSION) * bounds.height,
      },
      rotation: params.rotation,
    };
  }

  return {
    position,
    size: { width: 0, height: 0 },
    rotation: typeof params.rotation === "number" ? params.rotation : 0,
  };
}

export function toGlobalMaskSnapLines({
  lines,
  bounds,
  canvasSize,
}: {
  lines: SnapLine[];
  bounds: ElementBounds;
  canvasSize: { width: number; height: number };
}): SnapLine[] {
  const centerX = bounds.cx - canvasSize.width / 2;
  const centerY = bounds.cy - canvasSize.height / 2;

  return lines.map((line) =>
    line.type === "vertical"
      ? {
          type: "vertical" as const,
          position: centerX + line.position,
        }
      : {
          type: "horizontal" as const,
          position: centerY + line.position,
        },
  );
}
