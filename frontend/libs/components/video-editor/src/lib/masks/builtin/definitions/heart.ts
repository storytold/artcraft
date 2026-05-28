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

// Heart mask. Two symmetric Bezier curves meeting at the top notch
// (0, -halfHeight*0.475) and bottom point (0, halfHeight*0.725). The
// control-point ratios (1.225 / 0.125) shape the lobes — adjust those
// numbers to make a fatter or skinnier heart.

function buildHeartPath({
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
  const toPoint = ({
    localX,
    localY,
  }: {
    localX: number;
    localY: number;
  }) =>
    rotatePoint({
      x: centerX + localX,
      y: centerY + localY,
      centerX,
      centerY,
      rotationRad,
    });

  const start = toPoint({ localX: 0, localY: -halfHeight * 0.475 });
  const rightControl1 = toPoint({
    localX: halfWidth,
    localY: -halfHeight * 1.225,
  });
  const rightControl2 = toPoint({
    localX: halfWidth,
    localY: -halfHeight * 0.125,
  });
  const bottom = toPoint({ localX: 0, localY: halfHeight * 0.725 });
  const leftControl1 = toPoint({
    localX: -halfWidth,
    localY: -halfHeight * 0.125,
  });
  const leftControl2 = toPoint({
    localX: -halfWidth,
    localY: -halfHeight * 1.225,
  });

  const path = new Path2D();
  path.moveTo(start.x, start.y);
  path.bezierCurveTo(
    rightControl1.x,
    rightControl1.y,
    rightControl2.x,
    rightControl2.y,
    bottom.x,
    bottom.y,
  );
  path.bezierCurveTo(
    leftControl1.x,
    leftControl1.y,
    leftControl2.x,
    leftControl2.y,
    start.x,
    start.y,
  );
  path.closePath();
  return path;
}

export const heartMaskDefinition: MaskDefinition<"heart"> = {
  type: "heart",
  name: "Heart",
  features: {
    hasPosition: true,
    hasRotation: true,
    sizeMode: "width-height",
  },
  params: BOX_LIKE_MASK_PARAMS,
  interaction: buildBoxMaskInteraction({
    sizeMode: "width-height",
    buildOverlayPath({ width, height }) {
      const cx = width / 2;
      const cy = height / 2;
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      return [
        `M ${cx},${cy - halfHeight * 0.475}`,
        `C ${cx + halfWidth},${cy - halfHeight * 1.225} ${cx + halfWidth},${cy - halfHeight * 0.125} ${cx},${cy + halfHeight * 0.725}`,
        `C ${cx - halfWidth},${cy - halfHeight * 0.125} ${cx - halfWidth},${cy - halfHeight * 1.225} ${cx},${cy - halfHeight * 0.475}`,
        "Z",
      ].join(" ");
    },
  }),
  buildDefault(context) {
    return {
      type: "heart",
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
        return buildHeartPath({
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
        return buildHeartPath({
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
