import type { MaskDefinition } from "../../types";
import {
  BOX_LIKE_MASK_PARAMS,
  buildBoxMaskInteraction,
  computeBoxMaskParamUpdate,
  getBoxLikeGeometry,
  getDefaultSquareMaskParams,
  getStrokeOffset,
} from "../box-like";

// Ellipse mask. The bounding box overlay is rectangular (matches
// box-like behaviour) and a separate shape-outline overlay draws the
// elliptical curve so users see both the gesture target and the
// resulting shape.

export const ellipseMaskDefinition: MaskDefinition<"ellipse"> = {
  type: "ellipse",
  name: "Ellipse",
  features: {
    hasPosition: true,
    hasRotation: true,
    sizeMode: "width-height",
  },
  params: BOX_LIKE_MASK_PARAMS,
  interaction: buildBoxMaskInteraction({
    sizeMode: "width-height",
    buildOverlayPath({ width, height }) {
      const rx = Math.max((width - 1) / 2, 0);
      const ry = Math.max((height - 1) / 2, 0);
      const cx = width / 2;
      const cy = height / 2;
      return `M ${cx},${cy - ry} A ${rx},${ry} 0 1,1 ${cx},${cy + ry} A ${rx},${ry} 0 1,1 ${cx},${cy - ry} Z`;
    },
  }),
  buildDefault(context) {
    return {
      type: "ellipse",
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
        const path = new Path2D();
        path.ellipse(
          centerX,
          centerY,
          maskWidth / 2,
          maskHeight / 2,
          rotationRad,
          0,
          Math.PI * 2,
        );
        return path;
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
        const path = new Path2D();
        path.ellipse(
          centerX,
          centerY,
          Math.max(1, maskWidth / 2 + offset),
          Math.max(1, maskHeight / 2 + offset),
          rotationRad,
          0,
          Math.PI * 2,
        );
        return path;
      },
    },
  },
};
