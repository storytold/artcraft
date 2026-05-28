import type { ElementBounds } from "../preview/element-bounds";
import { MIN_MASK_DIMENSION } from "./dimensions";
import {
  snapPosition,
  snapRotation,
  snapScale,
  snapScaleAxes,
  type ScaleEdgePreference,
} from "../preview/preview-snap";
import type {
  MaskHandleId,
  MaskSnapArgs,
  MaskSnapResult,
  RectangleMaskParams,
  SplitMaskParams,
} from "./types";
import {
  getMaskSnapGeometry,
  setMaskLocalCenter,
  toGlobalMaskSnapLines,
} from "./geometry";

// Mask gesture snap pipeline. Each mask handle dispatches to one of:
//   - snapMaskPosition: position gesture → element-local snap, then
//     transform the active snap lines into global canvas-space
//   - snapMaskRotation: 90°-step rotation snap (matches element rotate)
//   - snapBoxMaskSize: width/height/scale gestures with preferred-
//     edge bias (e.g. dragging the left edge prefers left-edge snaps)
//
// All sizes are stored normalized (0..1 of element bounds), so the
// math converts to pixel-space, runs the snap, then converts back.

function getClampedRatio({
  next,
  base,
}: {
  next: number;
  base: number;
}): number {
  return (
    Math.max(next, MIN_MASK_DIMENSION) / Math.max(base, MIN_MASK_DIMENSION)
  );
}

function getPreferredEdges({
  handleId,
}: {
  handleId: MaskHandleId;
}): ScaleEdgePreference | undefined {
  if (handleId.kind === "edge") {
    return {
      left: handleId.side === "left",
      right: handleId.side === "right",
      top: handleId.side === "top",
      bottom: handleId.side === "bottom",
    };
  }

  if (handleId.kind === "corner") {
    return {
      left: handleId.corner.x === "left",
      right: handleId.corner.x === "right",
      top: handleId.corner.y === "top",
      bottom: handleId.corner.y === "bottom",
    };
  }

  return undefined;
}

function snapMaskPosition({
  proposedParams,
  bounds,
  canvasSize,
  snapThreshold,
}: {
  proposedParams: RectangleMaskParams;
  bounds: ElementBounds;
  canvasSize: { width: number; height: number };
  snapThreshold: { x: number; y: number };
}): MaskSnapResult<RectangleMaskParams>;
function snapMaskPosition({
  proposedParams,
  bounds,
  canvasSize,
  snapThreshold,
}: {
  proposedParams: SplitMaskParams;
  bounds: ElementBounds;
  canvasSize: { width: number; height: number };
  snapThreshold: { x: number; y: number };
}): MaskSnapResult<SplitMaskParams>;
function snapMaskPosition({
  proposedParams,
  bounds,
  canvasSize,
  snapThreshold,
}: {
  proposedParams: RectangleMaskParams | SplitMaskParams;
  bounds: ElementBounds;
  canvasSize: { width: number; height: number };
  snapThreshold: { x: number; y: number };
}): MaskSnapResult<RectangleMaskParams | SplitMaskParams> {
  const geometry = getMaskSnapGeometry({
    params: proposedParams,
    bounds,
  });
  if (!geometry) {
    return { params: proposedParams, activeLines: [] };
  }

  const { snappedPosition, activeLines } = snapPosition({
    proposedPosition: geometry.position,
    canvasSize: bounds,
    elementSize: geometry.size,
    rotation: geometry.rotation,
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

function snapMaskRotation({
  proposedParams,
}: {
  proposedParams: RectangleMaskParams;
}): MaskSnapResult<RectangleMaskParams>;
function snapMaskRotation({
  proposedParams,
}: {
  proposedParams: SplitMaskParams;
}): MaskSnapResult<SplitMaskParams>;
function snapMaskRotation({
  proposedParams,
}: {
  proposedParams: RectangleMaskParams | SplitMaskParams;
}): MaskSnapResult<RectangleMaskParams | SplitMaskParams> {
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

function snapBoxMaskSize({
  handleId,
  startParams,
  proposedParams,
  bounds,
  canvasSize,
  snapThreshold,
}: {
  handleId: MaskHandleId;
  startParams: RectangleMaskParams;
  proposedParams: RectangleMaskParams;
  bounds: ElementBounds;
  canvasSize: { width: number; height: number };
  snapThreshold: { x: number; y: number };
}): MaskSnapResult<RectangleMaskParams> {
  const geometry = getMaskSnapGeometry({
    params: proposedParams,
    bounds,
  });
  if (!geometry) {
    return { params: proposedParams, activeLines: [] };
  }

  const localCanvasSize = bounds;
  const baseWidth =
    Math.max(startParams.width, MIN_MASK_DIMENSION) * bounds.width;
  const baseHeight =
    Math.max(startParams.height, MIN_MASK_DIMENSION) * bounds.height;
  const preferredEdges = getPreferredEdges({ handleId });

  if (
    handleId.kind === "edge" &&
    (handleId.side === "right" || handleId.side === "left")
  ) {
    const proposedScaleX = getClampedRatio({
      next: proposedParams.width,
      base: startParams.width,
    });
    const { x } = snapScaleAxes({
      proposedScaleX,
      proposedScaleY: 1,
      position: geometry.position,
      baseWidth,
      baseHeight,
      rotation: proposedParams.rotation,
      canvasSize: localCanvasSize,
      snapThreshold,
      preferredEdges,
    });

    return {
      params: {
        ...proposedParams,
        width: Math.max(MIN_MASK_DIMENSION, startParams.width * x.snappedScale),
      },
      activeLines: toGlobalMaskSnapLines({
        lines: x.activeLines,
        bounds,
        canvasSize,
      }),
    };
  }

  if (
    handleId.kind === "edge" &&
    (handleId.side === "top" || handleId.side === "bottom")
  ) {
    const proposedScaleY = getClampedRatio({
      next: proposedParams.height,
      base: startParams.height,
    });
    const { y } = snapScaleAxes({
      proposedScaleX: 1,
      proposedScaleY,
      position: geometry.position,
      baseWidth,
      baseHeight,
      rotation: proposedParams.rotation,
      canvasSize: localCanvasSize,
      snapThreshold,
      preferredEdges,
    });

    return {
      params: {
        ...proposedParams,
        height: Math.max(
          MIN_MASK_DIMENSION,
          startParams.height * y.snappedScale,
        ),
      },
      activeLines: toGlobalMaskSnapLines({
        lines: y.activeLines,
        bounds,
        canvasSize,
      }),
    };
  }

  if (handleId.kind === "scale") {
    const baseScale = Math.max(startParams.scale, MIN_MASK_DIMENSION);
    const proposedScale = getClampedRatio({
      next: proposedParams.scale,
      base: startParams.scale,
    });
    const { snappedScale, activeLines } = snapScale({
      proposedScale,
      position: geometry.position,
      baseWidth: baseWidth * baseScale,
      baseHeight: baseHeight * baseScale,
      rotation: proposedParams.rotation,
      canvasSize: localCanvasSize,
      snapThreshold,
      preferredEdges,
    });

    return {
      params: {
        ...proposedParams,
        scale: Math.max(MIN_MASK_DIMENSION, startParams.scale * snappedScale),
      },
      activeLines: toGlobalMaskSnapLines({
        lines: activeLines,
        bounds,
        canvasSize,
      }),
    };
  }

  if (handleId.kind === "corner") {
    const proposedScale = getClampedRatio({
      next: proposedParams.width,
      base: startParams.width,
    });
    const { snappedScale, activeLines } = snapScale({
      proposedScale,
      position: geometry.position,
      baseWidth,
      baseHeight,
      rotation: proposedParams.rotation,
      canvasSize: localCanvasSize,
      snapThreshold,
      preferredEdges,
    });

    return {
      params: {
        ...proposedParams,
        width: Math.max(MIN_MASK_DIMENSION, startParams.width * snappedScale),
        height: Math.max(MIN_MASK_DIMENSION, startParams.height * snappedScale),
      },
      activeLines: toGlobalMaskSnapLines({
        lines: activeLines,
        bounds,
        canvasSize,
      }),
    };
  }

  return { params: proposedParams, activeLines: [] };
}

export function snapBoxMaskInteraction({
  handleId,
  startParams,
  proposedParams,
  bounds,
  canvasSize,
  snapThreshold,
}: {
  handleId: MaskHandleId;
  startParams: RectangleMaskParams;
  proposedParams: RectangleMaskParams;
  bounds: ElementBounds;
  canvasSize: { width: number; height: number };
  snapThreshold: { x: number; y: number };
}): MaskSnapResult<RectangleMaskParams> {
  if (handleId.kind === "position") {
    return snapMaskPosition({
      proposedParams,
      bounds,
      canvasSize,
      snapThreshold,
    });
  }

  if (handleId.kind === "rotation") {
    return snapMaskRotation({ proposedParams });
  }

  return snapBoxMaskSize({
    handleId,
    startParams,
    proposedParams,
    bounds,
    canvasSize,
    snapThreshold,
  });
}

export function snapSplitMaskInteraction({
  handleId,
  proposedParams,
  bounds,
  canvasSize,
  snapThreshold,
}: MaskSnapArgs<SplitMaskParams>): MaskSnapResult<SplitMaskParams> {
  if (handleId.kind === "position") {
    return snapMaskPosition({
      proposedParams,
      bounds,
      canvasSize,
      snapThreshold,
    });
  }

  if (handleId.kind === "rotation") {
    return snapMaskRotation({ proposedParams });
  }

  return { params: proposedParams, activeLines: [] };
}
