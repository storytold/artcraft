import type { MaskDefinition } from "../../types";
import {
  BOX_LIKE_MASK_PARAMS,
  buildBoxMaskInteraction,
  computeBoxMaskParamUpdate,
  getBoxLikeGeometry,
  getDefaultSquareMaskParams,
  getStrokeOffset,
  rotatePoint,
} from "../box-like";

// Rectangle mask — four corners, rotated as a unit. No overlay path
// (the bounding-box rect IS the shape), so buildBoxMaskInteraction
// doesn't pass a buildOverlayPath.

function buildRectanglePath({
  centerX,
  centerY,
  halfWidth,
  halfHeight,
  rotationRad,
}: {
  centerX: number;
  centerY: number;
  halfWidth: number;
  halfHeight: number;
  rotationRad: number;
}): Path2D {
  const corners = [
    { x: centerX - halfWidth, y: centerY - halfHeight },
    { x: centerX + halfWidth, y: centerY - halfHeight },
    { x: centerX + halfWidth, y: centerY + halfHeight },
    { x: centerX - halfWidth, y: centerY + halfHeight },
  ].map((point) =>
    rotatePoint({
      ...point,
      centerX,
      centerY,
      rotationRad,
    }),
  );

  const path = new Path2D();
  path.moveTo(corners[0].x, corners[0].y);
  for (const corner of corners.slice(1)) {
    path.lineTo(corner.x, corner.y);
  }
  path.closePath();
  return path;
}

export const rectangleMaskDefinition: MaskDefinition<"rectangle"> = {
  type: "rectangle",
  name: "Rectangle",
  features: {
    hasPosition: true,
    hasRotation: true,
    sizeMode: "width-height",
  },
  params: BOX_LIKE_MASK_PARAMS,
  interaction: buildBoxMaskInteraction({
    sizeMode: "width-height",
  }),
  buildDefault(context) {
    return {
      type: "rectangle",
      params: getDefaultSquareMaskParams(context),
    };
  },
  computeParamUpdate: computeBoxMaskParamUpdate,
  renderer: {
    body: {
      kind: "fillPath",
      buildPath({ resolvedParams, width, height }) {
        const params = resolvedParams;
        const { centerX, centerY, maskWidth, maskHeight, rotationRad } =
          getBoxLikeGeometry({ params, width, height });
        return buildRectanglePath({
          centerX,
          centerY,
          halfWidth: maskWidth / 2,
          halfHeight: maskHeight / 2,
          rotationRad,
        });
      },
    },
    stroke: {
      kind: "strokeFromPath",
      buildStrokePath({ resolvedParams, width, height }) {
        const params = resolvedParams;
        const { centerX, centerY, maskWidth, maskHeight, rotationRad } =
          getBoxLikeGeometry({ params, width, height });
        const offset = getStrokeOffset({
          strokeAlign: params.strokeAlign,
          strokeWidth: params.strokeWidth,
        });
        return buildRectanglePath({
          centerX,
          centerY,
          halfWidth: Math.max(1, maskWidth / 2 + offset),
          halfHeight: Math.max(1, maskHeight / 2 + offset),
          rotationRad,
        });
      },
    },
  },
};
