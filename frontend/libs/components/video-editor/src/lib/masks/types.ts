// Phase-1 port of the mask DATA types only. The full file in OpenCut also
// defines:
//   - MaskBody / MaskStroke / MaskRenderer (canvas rendering)
//   - MaskHandle* / MaskOverlay (interaction)
//   - MaskInteractionDefinition / MaskDefinition (registry shape)
//   - MaskParamUpdateArgs / MaskSnapArgs / MaskSnapResult (gesture math)
//
// Those depend on preview/element-bounds, preview/preview-snap, and the
// canvas-rendering layer which aren't yet ported. Re-add them here when
// those folders land. For phase 1 we only need the data shape so
// timeline/types.ts can reference `Mask` on TimelineElement.

// Text style primitives — inlined here (rather than imported from
// text/primitives) because text/primitives pulls in the whole text
// layout/typography runtime which isn't ported yet. Identical string
// unions to the source-of-truth file.
type TextFontWeight = "normal" | "bold";
type TextFontStyle = "normal" | "italic";
type TextDecoration = "none" | "underline" | "line-through";

// Freeform path point. The OpenCut runtime in masks/freeform/path.ts has
// guards and helpers that depend on preview/element-bounds — those will
// land later. The bare interface is enough for the data layer.
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
