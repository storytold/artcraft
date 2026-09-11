import { BaseNode } from "./base-node";
import type { Effect, EffectPass } from "../../../effects/types";
import type { Mask } from "../../../masks/types";
import type { BlendMode, Transform } from "../../../rendering";
import type { RetimeConfig, VisualElement } from "../../../timeline/types";

export interface VisualNodeParams {
  duration: number;
  timeOffset: number;
  trimStart: number;
  trimEnd: number;
  retime?: RetimeConfig;
  transform: Transform;
  animations?: VisualElement["animations"];
  opacity: number;
  blendMode?: BlendMode;
  effects?: Effect[];
  masks?: Mask[];
}

export interface ResolvedVisualNodeState {
  localTime: number;
  transform: Transform;
  opacity: number;
  effectPasses: EffectPass[][];
}

export interface ResolvedVisualSourceNodeState extends ResolvedVisualNodeState {
  source: CanvasImageSource;
  sourceWidth: number;
  sourceHeight: number;
}

export abstract class VisualNode<
  Params extends VisualNodeParams = VisualNodeParams,
  Resolved extends ResolvedVisualNodeState = ResolvedVisualNodeState,
> extends BaseNode<Params, Resolved> {}
