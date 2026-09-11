import { generateUUID } from "../../utils/id";
import type { ParamDefinition } from "../../params";
import type { ElementBounds } from "../../preview/element-bounds";
import type {
  FreeformPathMask,
  FreeformPathMaskParams,
  MaskDefinition,
  MaskHandlePosition,
  MaskOverlay,
  MaskParamUpdateArgs,
} from "../types";
import {
  buildFreeformPath2D,
  buildFreeformSvgPath,
  freeformCanvasPointToLocal,
  findClosestPointOnFreeformSegment,
  getFreeformCanvasSegments,
  getFreeformCanvasGeometry,
  getFreeformLocalBounds,
  getFreeformSegmentCount,
  insertPointIntoFreeformSegment,
  recenterFreeformPath,
  type FreeformPathPoint,
} from "./path";
import { getBoxMaskHandlePositions } from "../handle-positions";
import { computeFeatherUpdate } from "../param-update";
import {
  setMaskLocalCenter,
  toGlobalMaskSnapLines,
} from "../geometry";
import {
  snapPosition,
  snapRotation,
  snapScale,
} from "../../preview/preview-snap";
import { PEN_CURSOR } from "../../preview/components/cursors";

const PERCENTAGE_DISPLAY = {
  displayMultiplier: 100,
  step: 1,
} as const;

const FREEFORM_PATH_MASK_PARAMS: ParamDefinition<keyof FreeformPathMaskParams & string>[] = [
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

function getFreeformDisplayHandles({
  params,
  displayScale,
  bounds,
}: {
  params: FreeformPathMaskParams;
  displayScale: number;
  bounds: ElementBounds;
}): {
  handles: MaskHandlePosition[];
  overlays: MaskOverlay[];
} {
  const points = params.path;
  const geometry = getFreeformCanvasGeometry({
    points,
    centerX: params.centerX,
    centerY: params.centerY,
    rotation: params.rotation,
    scale: params.scale,
    bounds,
  });

  const handles: MaskHandlePosition[] = [];
  const overlays: MaskOverlay[] = [];

  if (points.length > 0) {
    overlays.push({
      id: "path",
      type: "canvas-path",
      pathData: buildFreeformSvgPath({
        points,
        centerX: params.centerX,
        centerY: params.centerY,
        rotation: params.rotation,
        scale: params.scale,
        bounds,
        closed: params.closed,
      }),
      coordinateSpace: "canvas",
    });
  }

  if (params.closed) {
    const segmentStrokeWidth = 12;
    overlays.push(
      ...getFreeformCanvasSegments({
        points,
        centerX: params.centerX,
        centerY: params.centerY,
        rotation: params.rotation,
        scale: params.scale,
        bounds,
        closed: true,
      }).map((segment): MaskOverlay => ({
        id: `segment:${segment.index}`,
        type: "canvas-path" as const,
        pathData: segment.pathData,
        coordinateSpace: "canvas" as const,
        handleId: { kind: "segment", index: segment.index },
        cursor: PEN_CURSOR,
        strokeOpacity: 0,
        strokeWidth: segmentStrokeWidth,
      })),
    );
  }

  const localBounds = getFreeformLocalBounds({ points, bounds });
  if (params.closed && localBounds) {
    handles.push(
      ...getBoxMaskHandlePositions({
        centerX: params.centerX,
        centerY: params.centerY,
        width: (localBounds.width * params.scale) / bounds.width,
        height: (localBounds.height * params.scale) / bounds.height,
        rotation: params.rotation,
        feather: params.feather,
        sizeMode: "uniform",
        showScaleHandle: false,
        bounds,
        displayScale,
      }),
    );
  }

  geometry.anchors.forEach((point) => {
    handles.push({
      id: { kind: "anchor", pointId: point.id },
      x: point.anchor.x,
      y: point.anchor.y,
      cursor: params.closed ? "move" : "pointer",
      kind: "point",
    });
  });

  return {
    handles,
    overlays,
  };
}

function updateFreeformPathMaskPoint({
  points,
  pointId,
  updater,
}: {
  points: FreeformPathPoint[];
  pointId: string;
  updater: (point: FreeformPathPoint) => FreeformPathPoint;
}) {
  return points.map((point) => (point.id === pointId ? updater(point) : point));
}

function computeFreeformParamUpdate({
  handleId,
  startParams,
  deltaX,
  deltaY,
  startCanvasX,
  startCanvasY,
  bounds,
}: MaskParamUpdateArgs<FreeformPathMaskParams>): Partial<FreeformPathMaskParams> {
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

  if (handleId.kind !== "anchor") {
    return {};
  }

  const points = startParams.path;
  const currentPoint = {
    x: startCanvasX + deltaX,
    y: startCanvasY + deltaY,
  };
  const localPoint = freeformCanvasPointToLocal({
    point: currentPoint,
    centerX: startParams.centerX,
    centerY: startParams.centerY,
    rotation: startParams.rotation,
    scale: startParams.scale,
    bounds,
  });

  return {
    path: updateFreeformPathMaskPoint({
      points,
      pointId: handleId.pointId,
      updater: (point) => ({
        ...point,
        x: localPoint.x,
        y: localPoint.y,
      }),
    }),
  };
}

export const freeformMaskDefinition: MaskDefinition<"freeform"> = {
  type: "freeform",
  name: "Pen tool",
  features: {
    hasPosition: true,
    hasRotation: true,
    sizeMode: "uniform",
  },
  params: FREEFORM_PATH_MASK_PARAMS,
  interaction: {
    getInteraction({
      params,
      bounds,
      displayScale,
      scaleX: _scaleX,
      scaleY: _scaleY,
    }) {
      return getFreeformDisplayHandles({ params, bounds, displayScale });
    },
    snap({
      handleId,
      proposedParams,
      startParams,
      bounds,
      canvasSize,
      snapThreshold,
    }) {
      const points = startParams.path;
      const localBounds = getFreeformLocalBounds({ points, bounds });
      if (!startParams.closed || !localBounds) {
        return {
          params: proposedParams,
          activeLines: [],
        };
      }

      const position = {
        x: proposedParams.centerX * bounds.width,
        y: proposedParams.centerY * bounds.height,
      };

      if (handleId.kind === "position") {
        const { snappedPosition, activeLines } = snapPosition({
          proposedPosition: position,
          canvasSize: bounds,
          elementSize: {
            width: localBounds.width * proposedParams.scale,
            height: localBounds.height * proposedParams.scale,
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
          baseWidth: localBounds.width,
          baseHeight: localBounds.height,
          rotation: proposedParams.rotation,
          canvasSize: bounds,
          snapThreshold,
          preferredEdges: {
            right: true,
            bottom: true,
          },
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
  buildDefault(): Omit<FreeformPathMask, "id"> {
    return {
      type: "freeform",
      params: {
        feather: 0,
        inverted: false,
        strokeColor: "#ffffff",
        strokeWidth: 0,
        strokeAlign: "center",
        path: [],
        closed: false,
        centerX: 0,
        centerY: 0,
        rotation: 0,
        scale: 1,
      },
    };
  },
  computeParamUpdate: computeFreeformParamUpdate,
  isActive(params) {
    return params.closed;
  },
  renderer: {
    body: {
      kind: "fillPath",
      buildPath({ resolvedParams, width, height }) {
        const params = resolvedParams;
        const points = params.path;
        if (!params.closed) {
          return new Path2D();
        }

        return buildFreeformPath2D({
          points,
          centerX: params.centerX,
          centerY: params.centerY,
          rotation: params.rotation,
          scale: params.scale,
          bounds: {
            cx: width / 2,
            cy: height / 2,
            width,
            height,
            rotation: 0,
          },
          closed: true,
        });
      },
    },
    stroke: {
      kind: "renderStroke",
      renderStroke({ resolvedParams, ctx, width, height }) {
        const params = resolvedParams;
        if (!params.closed) {
          return;
        }

        const points = params.path;
        const path = buildFreeformPath2D({
          points,
          centerX: params.centerX,
          centerY: params.centerY,
          rotation: params.rotation,
          scale: params.scale,
          bounds: {
            cx: width / 2,
            cy: height / 2,
            width,
            height,
            rotation: 0,
          },
          closed: true,
        });

        ctx.save();
        ctx.strokeStyle = params.strokeColor;
        ctx.lineWidth = params.strokeWidth;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke(path);

        if (params.strokeAlign === "inside") {
          ctx.globalCompositeOperation = "destination-in";
          ctx.fillStyle = "#ffffff";
          ctx.fill(path);
        }

        if (params.strokeAlign === "outside") {
          ctx.globalCompositeOperation = "destination-out";
          ctx.fillStyle = "#ffffff";
          ctx.fill(path);
        }
        ctx.restore();
      },
    },
  },
};

export function appendPointToFreeformPathMask({
  params,
  canvasPoint,
  bounds,
}: {
  params: FreeformPathMaskParams;
  canvasPoint: { x: number; y: number };
  bounds: ElementBounds;
}): FreeformPathMaskParams {
  const points = params.path;

  if (points.length === 0) {
    return {
      ...params,
      centerX:
        bounds.width === 0 ? 0 : (canvasPoint.x - bounds.cx) / bounds.width,
      centerY:
        bounds.height === 0 ? 0 : (canvasPoint.y - bounds.cy) / bounds.height,
      rotation: 0,
      scale: 1,
      path: [
        {
          id: generateUUID(),
          x: 0,
          y: 0,
          inX: 0,
          inY: 0,
          outX: 0,
          outY: 0,
        },
      ],
    };
  }

  const localPoint = freeformCanvasPointToLocal({
    point: canvasPoint,
    centerX: params.centerX,
    centerY: params.centerY,
    rotation: params.rotation,
    scale: params.scale,
    bounds,
  });
  const nextPoints = [
    ...points,
    {
      id: generateUUID(),
      x: localPoint.x,
      y: localPoint.y,
      inX: 0,
      inY: 0,
      outX: 0,
      outY: 0,
    },
  ];
  const recentered = recenterFreeformPath({
    points: nextPoints,
    centerX: params.centerX,
    centerY: params.centerY,
    rotation: params.rotation,
    scale: params.scale,
    bounds,
  });

  return {
    ...params,
    centerX: recentered.centerX,
    centerY: recentered.centerY,
    path: recentered.points,
  };
}

export function insertPointOnFreeformSegment({
  params,
  segmentIndex,
  canvasPoint,
  bounds,
  pointId = generateUUID(),
}: {
  params: FreeformPathMaskParams;
  segmentIndex: number;
  canvasPoint: { x: number; y: number };
  bounds: ElementBounds;
  pointId?: string;
}): { params: FreeformPathMaskParams; pointId: string } | null {
  const points = params.path;
  if (getFreeformSegmentCount({ points, closed: params.closed }) === 0) {
    return null;
  }

  const closestPoint = findClosestPointOnFreeformSegment({
    points,
    segmentIndex,
    canvasPoint,
    centerX: params.centerX,
    centerY: params.centerY,
    rotation: params.rotation,
    scale: params.scale,
    bounds,
    closed: params.closed,
  });
  if (!closestPoint) {
    return null;
  }

  const nextPoints = insertPointIntoFreeformSegment({
    points,
    segmentIndex,
    pointId,
    t: closestPoint.t,
    closed: params.closed,
  });
  if (nextPoints.length === points.length) {
    return null;
  }

  const recentered = recenterFreeformPath({
    points: nextPoints,
    centerX: params.centerX,
    centerY: params.centerY,
    rotation: params.rotation,
    scale: params.scale,
    bounds,
  });

  return {
    pointId,
    params: {
      ...params,
      centerX: recentered.centerX,
      centerY: recentered.centerY,
      path: recentered.points,
    },
  };
}
