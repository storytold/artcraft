import type { ElementBounds } from "../preview/element-bounds";
import type { SnapLine } from "../preview/preview-snap";
import type { ParamDefinition } from "../params";
import type {
  TextDecoration,
  TextFontStyle,
  TextFontWeight,
} from "../text/primitives";

// Full mask type system. Combines the data shapes (Mask union + params)
// with the renderer/interaction/definition shapes that the canvas
// renderer and preview gesture layer consume.
//
// Mask body kinds:
//   - fillPath:        path-based mask, single fill call
//   - drawOpaque:      caller draws opaque pixels however it wants
//   - drawWithFeather: caller handles feathered draws itself; can
//                      provide an opaqueFastPath when feather=0
//
// Mask strokes are separate so they can be drawn on top of the body
// using whatever alignment the renderer wants (inside/center/outside).

// Freeform path point — separate file in OpenCut (masks/freeform/path.ts)
// but the interface is inlined here so timeline/types can pull from
// masks/types without dragging in the freeform path utilities.
export interface FreeformPathPoint {
  id: string;
  x: number;
  y: number;
  inX: number;
  inY: number;
  outX: number;
  outY: number;
}

export type BuiltinMaskType =
  | "split"
  | "cinematic-bars"
  | "rectangle"
  | "ellipse"
  | "heart"
  | "diamond"
  | "star"
  | "text";

export type MaskType = BuiltinMaskType | "freeform";

export interface BaseMaskParams {
  feather: number;
  inverted: boolean;
  strokeColor: string;
  strokeWidth: number;
  strokeAlign: "inside" | "center" | "outside";
}

export interface SplitMaskParams extends BaseMaskParams {
  centerX: number;
  centerY: number;
  rotation: number;
}

export interface RectangleMaskParams extends BaseMaskParams {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
}

export interface TextMaskParams extends BaseMaskParams {
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: TextFontWeight;
  fontStyle: TextFontStyle;
  textDecoration: TextDecoration;
  letterSpacing: number;
  lineHeight: number;
  centerX: number;
  centerY: number;
  rotation: number;
  scale: number;
}

export interface FreeformPathMaskParams extends BaseMaskParams {
  path: FreeformPathPoint[];
  closed: boolean;
  centerX: number;
  centerY: number;
  rotation: number;
  scale: number;
}

export interface SplitMask {
  id: string;
  type: "split";
  params: SplitMaskParams;
}

export interface CinematicBarsMask {
  id: string;
  type: "cinematic-bars";
  params: RectangleMaskParams;
}

export interface RectangleMask {
  id: string;
  type: "rectangle";
  params: RectangleMaskParams;
}

export interface EllipseMask {
  id: string;
  type: "ellipse";
  params: RectangleMaskParams;
}

export interface HeartMask {
  id: string;
  type: "heart";
  params: RectangleMaskParams;
}

export interface DiamondMask {
  id: string;
  type: "diamond";
  params: RectangleMaskParams;
}

export interface StarMask {
  id: string;
  type: "star";
  params: RectangleMaskParams;
}

export interface TextMask {
  id: string;
  type: "text";
  params: TextMaskParams;
}

export type BuiltinShapeMask =
  | SplitMask
  | CinematicBarsMask
  | RectangleMask
  | EllipseMask
  | HeartMask
  | DiamondMask
  | StarMask
  | TextMask;

export interface FreeformPathMask {
  id: string;
  type: "freeform";
  params: FreeformPathMaskParams;
}

export type Mask = BuiltinShapeMask | FreeformPathMask;

export type MaskByType<TType extends MaskType> = Extract<Mask, { type: TType }>;
export type MaskParamsByType<TType extends MaskType> =
  MaskByType<TType>["params"];

type MaskPathArgs<TParams extends BaseMaskParams> = {
  resolvedParams: TParams;
  width: number;
  height: number;
};

type MaskDrawArgs<TParams extends BaseMaskParams> = MaskPathArgs<TParams> & {
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
};

export type MaskBody<TParams extends BaseMaskParams = BaseMaskParams> =
  | {
      kind: "fillPath";
      buildPath(args: MaskPathArgs<TParams>): Path2D;
    }
  | {
      kind: "drawOpaque";
      drawOpaque(args: MaskDrawArgs<TParams>): void;
    }
  | {
      kind: "drawWithFeather";
      drawWithFeather(args: MaskDrawArgs<TParams> & { feather: number }): void;
      opaqueFastPath?: {
        buildPath(args: MaskPathArgs<TParams>): Path2D;
      };
    };

export type MaskStroke<TParams extends BaseMaskParams = BaseMaskParams> =
  | {
      kind: "strokeFromPath";
      buildStrokePath(args: MaskPathArgs<TParams>): Path2D;
    }
  | {
      kind: "renderStroke";
      renderStroke(args: MaskDrawArgs<TParams>): void;
    };

export interface MaskRenderer<TParams extends BaseMaskParams = BaseMaskParams> {
  body: MaskBody<TParams>;
  stroke?: MaskStroke<TParams>;
}

export interface MaskFeatures {
  hasPosition: boolean;
  hasRotation: boolean;
  sizeMode: "none" | "uniform" | "width-height" | "height-only" | "width-only";
}

export type MaskHandleIcon = "rotate" | "feather";

export type MaskHandleKind = "corner" | "edge" | "icon" | "point";

type Side = "left" | "right" | "top" | "bottom";
type CornerXY = { x: "left" | "right"; y: "top" | "bottom" };

export type MaskHandleId =
  | { kind: "position" }
  | { kind: "rotation" }
  | { kind: "feather" }
  | { kind: "scale" }
  | { kind: "edge"; side: Side }
  | { kind: "corner"; corner: CornerXY }
  | { kind: "anchor"; pointId: string }
  | { kind: "segment"; index: number };

export function maskHandleIdKey({ id }: { id: MaskHandleId }): string {
  switch (id.kind) {
    case "position":
    case "rotation":
    case "feather":
    case "scale":
      return id.kind;
    case "edge":
      return id.side;
    case "corner":
      return `${id.corner.y}-${id.corner.x}`;
    case "anchor":
      return `point:${id.pointId}:anchor`;
    case "segment":
      return `segment:${id.index}`;
  }
}

export interface MaskHandlePosition {
  id: MaskHandleId;
  x: number;
  y: number;
  cursor: string;
  kind: MaskHandleKind;
  isSelected?: boolean;
  edgeAxis?: "horizontal" | "vertical";
  rotation?: number;
  icon?: MaskHandleIcon;
}

export interface MaskLineOverlay {
  id: string;
  type: "line";
  start: { x: number; y: number };
  end: { x: number; y: number };
  cursor?: string;
  handleId?: MaskHandleId;
}

export interface MaskRectOverlay {
  id: string;
  type: "rect";
  center: { x: number; y: number };
  width: number;
  height: number;
  rotation: number;
  dashed?: boolean;
  cursor?: string;
  handleId?: MaskHandleId;
}

export interface MaskShapeOverlay {
  id: string;
  type: "shape";
  center: { x: number; y: number };
  width: number;
  height: number;
  rotation: number;
  pathData: string;
  cursor?: string;
  handleId?: MaskHandleId;
}

export interface MaskCanvasPathOverlay {
  id: string;
  type: "canvas-path";
  pathData: string;
  coordinateSpace?: "canvas" | "overlay";
  cursor?: string;
  handleId?: MaskHandleId;
  strokeWidth?: number;
  strokeOpacity?: number;
}

export type MaskOverlay =
  | MaskLineOverlay
  | MaskRectOverlay
  | MaskShapeOverlay
  | MaskCanvasPathOverlay;

export interface MaskDefaultContext {
  elementSize?: { width: number; height: number };
}

export interface MaskParamUpdateArgs<
  TParams extends BaseMaskParams = BaseMaskParams,
> {
  handleId: MaskHandleId;
  startParams: TParams;
  deltaX: number;
  deltaY: number;
  startCanvasX: number;
  startCanvasY: number;
  bounds: ElementBounds;
  canvasSize: { width: number; height: number };
}

export interface MaskSnapArgs<TParams extends BaseMaskParams = BaseMaskParams> {
  handleId: MaskHandleId;
  startParams: TParams;
  proposedParams: TParams;
  bounds: ElementBounds;
  canvasSize: { width: number; height: number };
  snapThreshold: { x: number; y: number };
}

export interface MaskSnapResult<
  TParams extends BaseMaskParams = BaseMaskParams,
> {
  params: TParams;
  activeLines: SnapLine[];
}

export interface MaskInteractionResult {
  handles: MaskHandlePosition[];
  overlays: MaskOverlay[];
}

export interface MaskInteractionDefinition<
  TParams extends BaseMaskParams = BaseMaskParams,
> {
  getInteraction(args: {
    params: TParams;
    bounds: ElementBounds;
    displayScale: number;
    scaleX: number;
    scaleY: number;
  }): MaskInteractionResult;
  snap?(args: MaskSnapArgs<TParams>): MaskSnapResult<TParams>;
}

export interface MaskDefinition<TType extends MaskType = MaskType> {
  type: TType;
  name: string;
  features: MaskFeatures;
  params: ParamDefinition<keyof MaskParamsByType<TType> & string>[];
  renderer: MaskRenderer<MaskParamsByType<TType>>;
  interaction: MaskInteractionDefinition<MaskParamsByType<TType>>;
  // When defined and returning false, the mask is not applied and the
  // element renders fully visible.
  isActive?(params: MaskParamsByType<TType>): boolean;
  buildDefault(context: MaskDefaultContext): Omit<MaskByType<TType>, "id">;
  computeParamUpdate(
    args: MaskParamUpdateArgs<MaskParamsByType<TType>>,
  ): Partial<MaskParamsByType<TType>>;
}
