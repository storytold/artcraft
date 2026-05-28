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

// 5-pointed star. STAR_VERTEX_COUNT is 10 because each point uses two
// vertices (outer tip + inner notch). The angle stepping by π/5 gives
// the alternating pattern; STAR_INNER_RADIUS_RATIO controls how
// "pointy" the star is — smaller value = sharper points.

const STAR_INNER_RADIUS_RATIO = 0.45;
const STAR_VERTEX_COUNT = 10;

function buildStarPath({
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
  const path = new Path2D();

  for (let index = 0; index < STAR_VERTEX_COUNT; index++) {
    const isOuterVertex = index % 2 === 0;
    const radiusX = isOuterVertex
      ? halfWidth
      : halfWidth * STAR_INNER_RADIUS_RATIO;
    const radiusY = isOuterVertex
      ? halfHeight
      : halfHeight * STAR_INNER_RADIUS_RATIO;
    const angle = (index * Math.PI) / 5 - Math.PI / 2;
    const point = rotatePoint({
      x: centerX + radiusX * Math.cos(angle),
      y: centerY + radiusY * Math.sin(angle),
      centerX,
      centerY,
      rotationRad,
    });

    if (index === 0) {
      path.moveTo(point.x, point.y);
    } else {
      path.lineTo(point.x, point.y);
    }
  }

  path.closePath();
  return path;
}

function buildOverlayStarPath({
  width,
  height,
}: {
  width: number;
  height: number;
}): string {
  const centerX = width / 2;
  const centerY = height / 2;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const segments: string[] = [];

  for (let index = 0; index < STAR_VERTEX_COUNT; index++) {
    const isOuterVertex = index % 2 === 0;
    const radiusX = isOuterVertex
      ? halfWidth
      : halfWidth * STAR_INNER_RADIUS_RATIO;
    const radiusY = isOuterVertex
      ? halfHeight
      : halfHeight * STAR_INNER_RADIUS_RATIO;
    const angle = (index * Math.PI) / 5 - Math.PI / 2;
    const x = centerX + radiusX * Math.cos(angle);
    const y = centerY + radiusY * Math.sin(angle);
    segments.push(`${index === 0 ? "M" : "L"} ${x},${y}`);
  }

  return `${segments.join(" ")} Z`;
}

export const starMaskDefinition: MaskDefinition<"star"> = {
  type: "star",
  name: "Star",
  features: {
    hasPosition: true,
    hasRotation: true,
    sizeMode: "width-height",
  },
  params: BOX_LIKE_MASK_PARAMS,
  interaction: buildBoxMaskInteraction({
    sizeMode: "width-height",
    buildOverlayPath({ width, height }) {
      return buildOverlayStarPath({ width, height });
    },
  }),
  buildDefault(context) {
    return {
      type: "star",
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
        return buildStarPath({
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
        return buildStarPath({
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
