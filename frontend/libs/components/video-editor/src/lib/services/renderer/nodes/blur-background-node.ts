import type { EffectPass } from "../../../effects/types";
import type { RetimeConfig } from "../../../timeline/types";
import { BaseNode } from "./base-node";

export type BlurBackgroundNodeParams = {
  mediaId: string;
  url: string;
  file: File;
  mediaType: "video" | "image";
  duration: number;
  timeOffset: number;
  trimStart: number;
  trimEnd: number;
  retime?: RetimeConfig;
  blurIntensity: number;
};

export type BackdropSource = {
  source: CanvasImageSource;
  width: number;
  height: number;
};

export interface ResolvedBlurBackgroundNodeState {
  backdropSource: BackdropSource;
  passes: EffectPass[];
}

export class BlurBackgroundNode extends BaseNode<
  BlurBackgroundNodeParams,
  ResolvedBlurBackgroundNodeState
> {}
