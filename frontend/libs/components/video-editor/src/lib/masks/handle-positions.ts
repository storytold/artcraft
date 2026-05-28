import { FEATHER_HANDLE_SCALE } from "./feather";
import type { ElementBounds } from "../preview/element-bounds";
import type {
  MaskFeatures,
  MaskHandleId,
  MaskHandlePosition,
  MaskLineOverlay,
  MaskOverlay,
  MaskRectOverlay,
  RectangleMaskParams,
  MaskShapeOverlay,
} from "./types";

// Pure geometry helpers that turn a mask's normalized params into the
// concrete handle positions + overlay shapes the preview canvas draws.
// All math here works in element-local pixel space (rotated around the
// element's center); the renderer adds element_position + canvas_size
// translation when drawing.
//
// LINE_HANDLE_OFFSET_SCREEN_PX and BOX_HANDLE_OFFSET_SCREEN_PX are the
// distances handles sit out from the mask's edge, in *screen* pixels —
// divided by displayScale so handles stay the same physical size
// regardless of canvas zoom.

const LINE_HANDLE_OFFSET_SCREEN_PX = 20;
const BOX_HANDLE_OFFSET_SCREEN_PX = 20;
const LINE_EXTENT_MULTIPLIER = 50;

const CURSOR = {
  rotate: "crosshair",
  resizeDiagonal: "nwse-resize",
  resizeHorizontal: "ew-resize",
  resizeVertical: "ns-resize",
} as const;

// The renderer defines the split line as:
//   - normal direction: (cos(rotation), sin(rotation))
//   - line direction (parallel to cut): (-sin(rotation), cos(rotation))
//   - reference point: (centerX * width, centerY * height) from element centre
//
// So rotation=0 → normal points right → line runs vertically.
export function getLineMaskLinePoints({
  centerX,
  centerY,
  rotation,
  bounds,
}: {
  centerX: number;
  centerY: number;
  rotation: number;
  bounds: ElementBounds;
}): { start: { x: number; y: number }; end: { x: number; y: number } } {
  const angleRad = (rotation * Math.PI) / 180;
  const normalX = Math.cos(angleRad);
  const normalY = Math.sin(angleRad);
  const lineDirX = -normalY;
  const lineDirY = normalX;

  const cx = bounds.cx + centerX * bounds.width;
  const cy = bounds.cy + centerY * bounds.height;

  const extent = Math.max(bounds.width, bounds.height) * LINE_EXTENT_MULTIPLIER;

  return {
    start: {
      x: cx - lineDirX * extent,
      y: cy - lineDirY * extent,
    },
    end: {
      x: cx + lineDirX * extent,
      y: cy + lineDirY * extent,
    },
  };
}

export function getLineMaskOverlay({
  centerX,
  centerY,
  rotation,
  bounds,
  handleId = { kind: "position" },
  cursor = "move",
}: {
  centerX: number;
  centerY: number;
  rotation: number;
  bounds: ElementBounds;
  handleId?: MaskHandleId;
  cursor?: string;
}): MaskLineOverlay {
  const { start, end } = getLineMaskLinePoints({
    centerX,
    centerY,
    rotation,
    bounds,
  });

  return {
    id: "line",
    type: "line",
    start,
    end,
    handleId,
    cursor,
  };
}

export function getLineMaskHandlePositions({
  centerX,
  centerY,
  rotation,
  feather,
  bounds,
  displayScale,
}: {
  centerX: number;
  centerY: number;
  rotation: number;
  feather: number;
  bounds: ElementBounds;
  displayScale: number;
}): MaskHandlePosition[] {
  const angleRad = (rotation * Math.PI) / 180;
  const normalX = Math.cos(angleRad);
  const normalY = Math.sin(angleRad);

  const cx = bounds.cx + centerX * bounds.width;
  const cy = bounds.cy + centerY * bounds.height;

  const iconOffsetCanvas = LINE_HANDLE_OFFSET_SCREEN_PX / displayScale;
  const featherOffset = iconOffsetCanvas + feather * FEATHER_HANDLE_SCALE;

  return [
    {
      id: { kind: "rotation" },
      x: cx + normalX * iconOffsetCanvas,
      y: cy + normalY * iconOffsetCanvas,
      cursor: CURSOR.rotate,
      kind: "icon",
      icon: "rotate",
    },
    {
      id: { kind: "feather" },
      x: cx - normalX * featherOffset,
      y: cy - normalY * featherOffset,
      cursor: CURSOR.resizeHorizontal,
      kind: "icon",
      icon: "feather",
    },
  ];
}

function rotatePoint({
  localX,
  localY,
  cx,
  cy,
  angleRad,
}: {
  localX: number;
  localY: number;
  cx: number;
  cy: number;
  angleRad: number;
}): { x: number; y: number } {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: cx + localX * cos - localY * sin,
    y: cy + localX * sin + localY * cos,
  };
}

export function getBoxMaskHandlePositions({
  centerX,
  centerY,
  width,
  height,
  rotation,
  feather,
  sizeMode,
  showScaleHandle = true,
  bounds,
  displayScale,
}: {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotation: number;
  feather: number;
  sizeMode: MaskFeatures["sizeMode"];
  showScaleHandle?: boolean;
  bounds: ElementBounds;
  displayScale: number;
}): MaskHandlePosition[] {
  const cx = bounds.cx + centerX * bounds.width;
  const cy = bounds.cy + centerY * bounds.height;
  const angleRad = (rotation * Math.PI) / 180;
  const halfWidth = (width * bounds.width) / 2;
  const halfHeight = (height * bounds.height) / 2;

  const handles: MaskHandlePosition[] = [];
  const handleOffsetCanvas = BOX_HANDLE_OFFSET_SCREEN_PX / displayScale;

  const rotHandle = rotatePoint({
    localX: 0,
    localY: -halfHeight - handleOffsetCanvas,
    cx,
    cy,
    angleRad,
  });
  handles.push({
    id: { kind: "rotation" },
    x: rotHandle.x,
    y: rotHandle.y,
    cursor: CURSOR.rotate,
    kind: "icon",
    icon: "rotate",
  });

  const featherHandle = rotatePoint({
    localX: 0,
    localY: halfHeight + handleOffsetCanvas + feather * FEATHER_HANDLE_SCALE,
    cx,
    cy,
    angleRad,
  });
  handles.push({
    id: { kind: "feather" },
    x: featherHandle.x,
    y: featherHandle.y,
    cursor: CURSOR.resizeVertical,
    kind: "icon",
    icon: "feather",
  });

  if (sizeMode === "width-height") {
    const corners: {
      localX: number;
      localY: number;
      corner: Extract<MaskHandleId, { kind: "corner" }>["corner"];
    }[] = [
      {
        localX: -halfWidth,
        localY: -halfHeight,
        corner: { x: "left", y: "top" },
      },
      {
        localX: halfWidth,
        localY: -halfHeight,
        corner: { x: "right", y: "top" },
      },
      {
        localX: halfWidth,
        localY: halfHeight,
        corner: { x: "right", y: "bottom" },
      },
      {
        localX: -halfWidth,
        localY: halfHeight,
        corner: { x: "left", y: "bottom" },
      },
    ];
    for (const { localX, localY, corner } of corners) {
      const point = rotatePoint({ localX, localY, cx, cy, angleRad });
      handles.push({
        id: { kind: "corner", corner },
        x: point.x,
        y: point.y,
        cursor: CURSOR.resizeDiagonal,
        kind: "corner",
      });
    }
    const right = rotatePoint({
      localX: halfWidth,
      localY: 0,
      cx,
      cy,
      angleRad,
    });
    const left = rotatePoint({
      localX: -halfWidth,
      localY: 0,
      cx,
      cy,
      angleRad,
    });
    const bottom = rotatePoint({
      localX: 0,
      localY: halfHeight,
      cx,
      cy,
      angleRad,
    });
    handles.push({
      id: { kind: "edge", side: "left" },
      x: left.x,
      y: left.y,
      cursor: CURSOR.resizeHorizontal,
      kind: "edge",
      edgeAxis: "horizontal",
      rotation,
    });
    handles.push({
      id: { kind: "edge", side: "right" },
      x: right.x,
      y: right.y,
      cursor: CURSOR.resizeHorizontal,
      kind: "edge",
      edgeAxis: "horizontal",
      rotation,
    });
    handles.push({
      id: { kind: "edge", side: "bottom" },
      x: bottom.x,
      y: bottom.y,
      cursor: CURSOR.resizeVertical,
      kind: "edge",
      edgeAxis: "vertical",
      rotation,
    });
  } else if (sizeMode === "height-only") {
    const top = rotatePoint({
      localX: 0,
      localY: -halfHeight,
      cx,
      cy,
      angleRad,
    });
    const bottom = rotatePoint({
      localX: 0,
      localY: halfHeight,
      cx,
      cy,
      angleRad,
    });
    handles.push({
      id: { kind: "edge", side: "top" },
      x: top.x,
      y: top.y,
      cursor: CURSOR.resizeVertical,
      kind: "edge",
      edgeAxis: "vertical",
      rotation,
    });
    handles.push({
      id: { kind: "edge", side: "bottom" },
      x: bottom.x,
      y: bottom.y,
      cursor: CURSOR.resizeVertical,
      kind: "edge",
      edgeAxis: "vertical",
      rotation,
    });
  } else if (sizeMode === "width-only") {
    const left = rotatePoint({
      localX: -halfWidth,
      localY: 0,
      cx,
      cy,
      angleRad,
    });
    const right = rotatePoint({
      localX: halfWidth,
      localY: 0,
      cx,
      cy,
      angleRad,
    });
    handles.push({
      id: { kind: "edge", side: "left" },
      x: left.x,
      y: left.y,
      cursor: CURSOR.resizeHorizontal,
      kind: "edge",
      edgeAxis: "horizontal",
      rotation,
    });
    handles.push({
      id: { kind: "edge", side: "right" },
      x: right.x,
      y: right.y,
      cursor: CURSOR.resizeHorizontal,
      kind: "edge",
      edgeAxis: "horizontal",
      rotation,
    });
  } else if (sizeMode === "uniform" && showScaleHandle) {
    const point = rotatePoint({
      localX: halfWidth,
      localY: halfHeight,
      cx,
      cy,
      angleRad,
    });
    handles.push({
      id: { kind: "scale" },
      x: point.x,
      y: point.y,
      cursor: CURSOR.resizeDiagonal,
      kind: "corner",
    });
  }

  return handles;
}

export function getBoxMaskRectOverlay({
  centerX,
  centerY,
  width,
  height,
  rotation,
  bounds,
  handleId = { kind: "position" },
  cursor = "move",
  dashed = false,
}: {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotation: number;
  bounds: ElementBounds;
  handleId?: MaskHandleId;
  cursor?: string;
  dashed?: boolean;
}): MaskRectOverlay {
  return {
    id: "bounding-box",
    type: "rect",
    center: {
      x: bounds.cx + centerX * bounds.width,
      y: bounds.cy + centerY * bounds.height,
    },
    width: width * bounds.width,
    height: height * bounds.height,
    rotation,
    handleId,
    cursor,
    dashed,
  };
}

export function getBoxMaskShapeOverlay({
  centerX,
  centerY,
  width,
  height,
  rotation,
  bounds,
  pathData,
  handleId = { kind: "position" },
  cursor = "move",
}: {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotation: number;
  bounds: ElementBounds;
  pathData: string;
  handleId?: MaskHandleId;
  cursor?: string;
}): MaskShapeOverlay {
  return {
    id: "shape-outline",
    type: "shape",
    center: {
      x: bounds.cx + centerX * bounds.width,
      y: bounds.cy + centerY * bounds.height,
    },
    width: width * bounds.width,
    height: height * bounds.height,
    rotation,
    pathData,
    handleId,
    cursor,
  };
}

export function getBoxMaskOverlays({
  params,
  bounds,
  pathData,
  showBoundingBox = true,
}: {
  params: Pick<
    RectangleMaskParams,
    "centerX" | "centerY" | "width" | "height" | "rotation"
  >;
  bounds: ElementBounds;
  pathData?: string;
  showBoundingBox?: boolean;
}): MaskOverlay[] {
  const overlays: MaskOverlay[] = [];
  if (showBoundingBox) {
    overlays.push(
      getBoxMaskRectOverlay({
        centerX: params.centerX,
        centerY: params.centerY,
        width: params.width,
        height: params.height,
        rotation: params.rotation,
        bounds,
        dashed: Boolean(pathData),
      }),
    );
  }

  if (pathData) {
    overlays.push(
      getBoxMaskShapeOverlay({
        centerX: params.centerX,
        centerY: params.centerY,
        width: params.width,
        height: params.height,
        rotation: params.rotation,
        bounds,
        pathData,
      }),
    );
  }

  return overlays;
}
