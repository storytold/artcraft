import type {
  MaskDefaultContext,
  MaskDefinition,
  RectangleMaskParams,
} from "../../types";
import {
  BOX_LIKE_MASK_PARAMS,
  buildBoxMaskInteraction,
  computeBoxMaskParamUpdate,
  getDefaultBaseMaskParams,
  getStrokeOffset,
  rotatePoint,
} from "../box-like";

// Cinematic bars — one-dimensional band mask that runs canvas-wide even
// when rotated. The default width is set to the diagonal-fit ratio so
// rotating the band doesn't ever expose canvas corners. Height-only
// sizeMode hides the width handle from the user — width auto-scales to
// always span the canvas.

function getDefaultCinematicBarsMaskParams({
  elementSize,
}: MaskDefaultContext): RectangleMaskParams {
  const absWidth = Math.abs(elementSize?.width ?? 0);
  const absHeight = Math.abs(elementSize?.height ?? 0);
  const diagonal =
    absWidth > 0 && absHeight > 0
      ? Math.sqrt(absWidth ** 2 + absHeight ** 2)
      : 0;
  const fullSpanWidth =
    absWidth > 0 ? diagonal / absWidth : Math.SQRT2;

  return {
    ...getDefaultBaseMaskParams(),
    centerX: 0,
    centerY: 0,
    width: Math.max(fullSpanWidth, 1),
    height: 0.6,
    rotation: 0,
    scale: 1,
  };
}

function buildBandPath({
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

export const cinematicBarsMaskDefinition: MaskDefinition<"cinematic-bars"> = {
  type: "cinematic-bars",
  name: "Cinematic Bars",
  features: {
    hasPosition: true,
    hasRotation: true,
    sizeMode: "height-only",
  },
  params: BOX_LIKE_MASK_PARAMS,
  interaction: buildBoxMaskInteraction({
    sizeMode: "height-only",
    buildOverlayPath({ width, height }) {
      return `M 0,0 H ${width} V ${height} H 0 Z`;
    },
  }),
  buildDefault(context) {
    return {
      type: "cinematic-bars",
      params: getDefaultCinematicBarsMaskParams(context),
    };
  },
  computeParamUpdate: computeBoxMaskParamUpdate,
  renderer: {
    body: {
      kind: "fillPath",
      buildPath({ resolvedParams, width, height }) {
        const params = resolvedParams;
        const centerX = width / 2 + params.centerX * width;
        const centerY = height / 2 + params.centerY * height;
        const maskWidth = Math.max(params.width * width, width);
        const maskHeight = Math.max(params.height, 0.01) * height;
        const rotationRad = (params.rotation * Math.PI) / 180;

        return buildBandPath({
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
        const centerX = width / 2 + params.centerX * width;
        const centerY = height / 2 + params.centerY * height;
        const rotationRad = (params.rotation * Math.PI) / 180;
        const offset = getStrokeOffset({
          strokeAlign: params.strokeAlign,
          strokeWidth: params.strokeWidth,
        });

        return buildBandPath({
          centerX,
          centerY,
          halfWidth: Math.max(
            Math.max(params.width * width, width) / 2 + offset,
            1,
          ),
          halfHeight: Math.max(
            (Math.max(params.height, 0.01) * height) / 2 + offset,
            1,
          ),
          rotationRad,
        });
      },
    },
  },
};
