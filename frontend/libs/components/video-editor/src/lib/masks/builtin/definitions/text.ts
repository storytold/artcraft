import type { ParamDefinition } from "../../../params";
import type {
  MaskDefinition,
  MaskParamUpdateArgs,
  TextMask,
  TextMaskParams,
  MaskHandleId,
} from "../../types";
import { DEFAULTS } from "../../../timeline/defaults";
import { MIN_FONT_SIZE, MAX_FONT_SIZE } from "../../../text/typography";
import {
  drawMeasuredTextLayout,
  measureTextLayout,
  strokeMeasuredTextLayout,
} from "../../../text/primitives";
import { getTextMeasurementContext } from "../../../text/measure-element";
import { getTextVisualRect } from "../../../text/layout";
import {
  getBoxMaskHandlePositions,
  getBoxMaskRectOverlay,
} from "../../handle-positions";
import { computeFeatherUpdate } from "../../param-update";
import {
  setMaskLocalCenter,
  toGlobalMaskSnapLines,
} from "../../geometry";
import {
  snapPosition,
  snapRotation,
  snapScale,
  type ScaleEdgePreference,
} from "../../../preview/preview-snap";

// Text-shaped mask. Stamps glyphs as the mask body — the mask is opaque
// where text pixels are drawn. Implements `drawOpaque` (filled glyphs)
// and `renderStroke` (outlined glyphs with optional inside/outside
// composite trim).
//
// The text layout pipeline measures glyphs once and reuses the layout
// across body + stroke draws so we don't pay TextMetrics twice. Scale
// is applied via canvas transform (not by changing fontSize) — keeps
// stroke width pixel-accurate at any scale.

const PERCENTAGE_DISPLAY = {
  displayMultiplier: 100,
  step: 1,
} as const;

const TEXT_MASK_ALIGNMENT = "center";

const TEXT_MASK_PARAMS: ParamDefinition<keyof TextMaskParams & string>[] = [
  {
    key: "centerX",
    label: "X",
    type: "number",
    default: 0,
    min: -100,
    max: 100,
    ...PERCENTAGE_DISPLAY,
  },
  {
    key: "centerY",
    label: "Y",
    type: "number",
    default: 0,
    min: -100,
    max: 100,
    ...PERCENTAGE_DISPLAY,
  },
  {
    key: "fontSize",
    label: "Size",
    type: "number",
    default: 15,
    min: MIN_FONT_SIZE,
    max: MAX_FONT_SIZE,
    step: 1,
  },
  {
    key: "rotation",
    label: "Rotation",
    type: "number",
    default: 0,
    min: 0,
    max: 360,
    step: 1,
  },
  {
    key: "scale",
    label: "Scale",
    type: "number",
    default: 1,
    min: 1,
    max: 500,
    ...PERCENTAGE_DISPLAY,
  },
];

function measureTextMask({
  params,
  height,
}: {
  params: TextMaskParams;
  height: number;
}) {
  const layout = measureTextLayout({
    text: {
      content: params.content,
      fontSize: params.fontSize,
      fontFamily: params.fontFamily,
      fontWeight: params.fontWeight,
      fontStyle: params.fontStyle,
      textAlign: TEXT_MASK_ALIGNMENT,
      textDecoration: params.textDecoration,
      letterSpacing: params.letterSpacing,
      lineHeight: params.lineHeight,
    },
    canvasHeight: height,
    ctx: getTextMeasurementContext(),
  });
  const visualRect = getTextVisualRect({
    textAlign: layout.textAlign,
    block: layout.block,
    background: { enabled: false, color: "transparent" },
    fontSizeRatio: layout.fontSizeRatio,
  });

  return {
    layout,
    intrinsicWidth: Math.max(1, visualRect.width),
    intrinsicHeight: Math.max(1, visualRect.height),
  };
}

function getScalePreferredEdges({
  handleId,
}: {
  handleId: MaskHandleId;
}): ScaleEdgePreference | undefined {
  if (handleId.kind !== "scale") {
    return undefined;
  }

  return {
    right: true,
    bottom: true,
  };
}

function computeTextMaskParamUpdate({
  handleId,
  startParams,
  deltaX,
  deltaY,
  startCanvasX,
  startCanvasY,
  bounds,
}: MaskParamUpdateArgs<TextMaskParams>): Partial<TextMaskParams> {
  if (handleId.kind === "position") {
    return {
      centerX: startParams.centerX + deltaX / bounds.width,
      centerY: startParams.centerY + deltaY / bounds.height,
    };
  }

  const pivotX = bounds.cx + startParams.centerX * bounds.width;
  const pivotY = bounds.cy + startParams.centerY * bounds.height;

  if (handleId.kind === "rotation") {
    const startAngle =
      (Math.atan2(startCanvasY - pivotY, startCanvasX - pivotX) * 180) /
      Math.PI;
    const currentAngle =
      (Math.atan2(
        startCanvasY + deltaY - pivotY,
        startCanvasX + deltaX - pivotX,
      ) *
        180) /
      Math.PI;

    let deltaAngle = currentAngle - startAngle;
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;

    return {
      rotation: (((startParams.rotation + deltaAngle) % 360) + 360) % 360,
    };
  }

  if (handleId.kind === "feather") {
    const angleRad = (startParams.rotation * Math.PI) / 180;
    return computeFeatherUpdate({
      startFeather: startParams.feather,
      deltaX,
      deltaY,
      directionX: -Math.sin(angleRad),
      directionY: Math.cos(angleRad),
    });
  }

  if (handleId.kind === "scale") {
    const startDistance = Math.hypot(
      startCanvasX - pivotX,
      startCanvasY - pivotY,
    );
    const currentDistance = Math.hypot(
      startCanvasX + deltaX - pivotX,
      startCanvasY + deltaY - pivotY,
    );
    const scaleFactor = startDistance > 0 ? currentDistance / startDistance : 1;
    return {
      scale: Math.max(0.01, startParams.scale * scaleFactor),
    };
  }

  return {};
}

export const textMaskDefinition: MaskDefinition<"text"> = {
  type: "text",
  name: "Text",
  features: {
    hasPosition: true,
    hasRotation: true,
    sizeMode: "uniform",
  },
  params: TEXT_MASK_PARAMS,
  interaction: {
    getInteraction({
      params,
      bounds,
      displayScale,
      scaleX: _scaleX,
      scaleY: _scaleY,
    }) {
      const { intrinsicWidth, intrinsicHeight } = measureTextMask({
        params,
        height: bounds.height,
      });
      const width = (intrinsicWidth * params.scale) / bounds.width;
      const height = (intrinsicHeight * params.scale) / bounds.height;
      return {
        handles: getBoxMaskHandlePositions({
          centerX: params.centerX,
          centerY: params.centerY,
          width,
          height,
          rotation: params.rotation,
          feather: params.feather,
          sizeMode: "uniform",
          bounds,
          displayScale,
        }),
        overlays: [
          getBoxMaskRectOverlay({
            centerX: params.centerX,
            centerY: params.centerY,
            width,
            height,
            rotation: params.rotation,
            bounds,
          }),
        ],
      };
    },
    snap({
      handleId,
      startParams,
      proposedParams,
      bounds,
      canvasSize,
      snapThreshold,
    }) {
      const { intrinsicWidth, intrinsicHeight } = measureTextMask({
        params: startParams,
        height: bounds.height,
      });
      const position = {
        x: proposedParams.centerX * bounds.width,
        y: proposedParams.centerY * bounds.height,
      };

      if (handleId.kind === "position") {
        const { snappedPosition, activeLines } = snapPosition({
          proposedPosition: position,
          canvasSize: bounds,
          elementSize: {
            width: intrinsicWidth * proposedParams.scale,
            height: intrinsicHeight * proposedParams.scale,
          },
          rotation: proposedParams.rotation,
          snapThreshold,
        });

        return {
          params: {
            ...proposedParams,
            ...setMaskLocalCenter({
              center: snappedPosition,
              bounds,
            }),
          },
          activeLines: toGlobalMaskSnapLines({
            lines: activeLines,
            bounds,
            canvasSize,
          }),
        };
      }

      if (handleId.kind === "rotation") {
        const { snappedRotation } = snapRotation({
          proposedRotation: proposedParams.rotation,
        });
        return {
          params: {
            ...proposedParams,
            rotation: snappedRotation,
          },
          activeLines: [],
        };
      }

      if (handleId.kind === "scale") {
        const { snappedScale, activeLines } = snapScale({
          proposedScale: proposedParams.scale,
          position,
          baseWidth: intrinsicWidth,
          baseHeight: intrinsicHeight,
          rotation: proposedParams.rotation,
          canvasSize: bounds,
          snapThreshold,
          preferredEdges: getScalePreferredEdges({ handleId }),
        });

        return {
          params: {
            ...proposedParams,
            scale: Math.max(0.01, snappedScale),
          },
          activeLines: toGlobalMaskSnapLines({
            lines: activeLines,
            bounds,
            canvasSize,
          }),
        };
      }

      return {
        params: proposedParams,
        activeLines: [],
      };
    },
  },
  buildDefault(): Omit<TextMask, "id"> {
    return {
      type: "text",
      params: {
        feather: 0,
        inverted: false,
        strokeColor: "#ffffff",
        strokeWidth: 0,
        strokeAlign: "center",
        content: "Mask",
        fontSize: 15,
        fontFamily: "Arial",
        fontWeight: "normal",
        fontStyle: "normal",
        textDecoration: "none",
        letterSpacing: DEFAULTS.text.letterSpacing,
        lineHeight: DEFAULTS.text.lineHeight,
        centerX: 0,
        centerY: 0,
        rotation: 0,
        scale: 1,
      },
    };
  },
  computeParamUpdate: computeTextMaskParamUpdate,
  isActive(params) {
    return params.content.trim().length > 0;
  },
  renderer: {
    body: {
      kind: "drawOpaque",
      drawOpaque({ resolvedParams, ctx, width, height }) {
        const params = resolvedParams;
        const { layout } = measureTextMask({ params, height });

        ctx.save();
        ctx.translate(
          width / 2 + params.centerX * width,
          height / 2 + params.centerY * height,
        );
        ctx.scale(params.scale, params.scale);
        if (params.rotation) {
          ctx.rotate((params.rotation * Math.PI) / 180);
        }
        drawMeasuredTextLayout({
          ctx,
          layout,
          textColor: "#ffffff",
          background: null,
        });
        ctx.restore();
      },
    },
    stroke: {
      kind: "renderStroke",
      renderStroke({ resolvedParams, ctx, width, height }) {
        const params = resolvedParams;
        const { layout } = measureTextMask({ params, height });

        ctx.save();
        ctx.translate(
          width / 2 + params.centerX * width,
          height / 2 + params.centerY * height,
        );
        ctx.scale(params.scale, params.scale);
        if (params.rotation) {
          ctx.rotate((params.rotation * Math.PI) / 180);
        }

        strokeMeasuredTextLayout({
          ctx,
          layout,
          strokeColor: params.strokeColor,
          strokeWidth: params.strokeWidth,
        });

        if (params.strokeAlign === "inside") {
          ctx.globalCompositeOperation = "destination-in";
          drawMeasuredTextLayout({
            ctx,
            layout,
            textColor: "#ffffff",
            background: null,
          });
        }

        if (params.strokeAlign === "outside") {
          ctx.globalCompositeOperation = "destination-out";
          drawMeasuredTextLayout({
            ctx,
            layout,
            textColor: "#ffffff",
            background: null,
          });
        }

        ctx.restore();
      },
    },
  },
};
