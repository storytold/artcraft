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

function buildDiamondPath({
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
  const points = [
    { x: centerX, y: centerY - halfHeight },
    { x: centerX + halfWidth, y: centerY },
    { x: centerX, y: centerY + halfHeight },
    { x: centerX - halfWidth, y: centerY },
  ].map((point) =>
    rotatePoint({
      ...point,
      centerX,
      centerY,
      rotationRad,
    }),
  );

  const path = new Path2D();
  path.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    path.lineTo(point.x, point.y);
  }
  path.closePath();
  return path;
}

export const diamondMaskDefinition: MaskDefinition<"diamond"> = {
  type: "diamond",
  name: "Diamond",
  features: {
    hasPosition: true,
    hasRotation: true,
    sizeMode: "width-height",
  },
  params: BOX_LIKE_MASK_PARAMS,
  interaction: buildBoxMaskInteraction({
    sizeMode: "width-height",
    buildOverlayPath({ width, height }) {
      return `M ${width / 2},0 L ${width},${height / 2} L ${width / 2},${height} L 0,${height / 2} Z`;
    },
  }),
  buildDefault(context) {
    return {
      type: "diamond",
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
        return buildDiamondPath({
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
        return buildDiamondPath({
          centerX,
          centerY,
          halfWidth: Math.max(maskWidth / 2 + offset, 1),
          halfHeight: Math.max(maskHeight / 2 + offset, 1),
          rotationRad,
        });
      },
    },
  },
};
