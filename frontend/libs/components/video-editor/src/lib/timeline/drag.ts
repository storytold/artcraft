import type { MaskableElement, VisualElement } from "./types";
import type { ParamValues } from "../params";

// Drag payload shapes for the asset → timeline flow. These objects are
// produced by AssetsPanel items at drag-start and consumed by the
// timeline drop handlers. Each variant carries the minimum the timeline
// needs to build a new TimelineElement on drop.

interface BaseDragData {
  id: string;
  name: string;
}

export interface MediaDragData extends BaseDragData {
  type: "media";
  mediaType: "image" | "video" | "audio";
  targetElementTypes?: MaskableElement["type"][];
}

export interface TextDragData extends BaseDragData {
  type: "text";
  content: string;
}

export interface StickerDragData extends BaseDragData {
  type: "sticker";
  stickerId: string;
}

export interface GraphicDragData extends BaseDragData {
  type: "graphic";
  definitionId: string;
  params: Partial<ParamValues>;
}

export interface EffectDragData extends BaseDragData {
  type: "effect";
  effectType: string;
  targetElementTypes: VisualElement["type"][];
}

export type TimelineDragData =
  | MediaDragData
  | TextDragData
  | StickerDragData
  | GraphicDragData
  | EffectDragData;
