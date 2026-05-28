import type { ParamDefinition, ParamValues } from "../params";

export interface Effect {
  id: string;
  type: string;
  params: ParamValues;
  enabled: boolean;
}

export type EffectUniformValue = number | number[];

export interface EffectPass {
  shader: string;
  uniforms: Record<string, EffectUniformValue>;
}

export interface EffectPassTemplate {
  shader: string;
  uniforms(params: {
    effectParams: ParamValues;
    width: number;
    height: number;
  }): Record<string, EffectUniformValue>;
}

export interface EffectRendererConfig {
  passes: EffectPassTemplate[];
  buildPasses?: (params: {
    effectParams: ParamValues;
    width: number;
    height: number;
  }) => EffectPass[];
}

export interface EffectDefinition {
  type: string;
  name: string;
  keywords: string[];
  params: ParamDefinition[];
  renderer: EffectRendererConfig;
}
