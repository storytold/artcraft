import { generateUUID } from "../utils/id";
import { buildDefaultParamValues } from "../params/registry";
import { effectsRegistry } from "./registry";
import type { ParamValues } from "../params";
import type { Effect, EffectDefinition, EffectPass } from "./types";
import { VISUAL_ELEMENT_TYPES } from "../timeline/types";

export { effectsRegistry } from "./registry";
export { registerDefaultEffects } from "./definitions";

// Resolves an effect's per-frame passes. Each definition either ships a
// static `passes` array (uniforms recomputed per frame from params) or a
// `buildPasses` function for effects that need to vary pass count (e.g.
// multi-iteration Gaussian blur).
export function resolveEffectPasses({
  definition,
  effectParams,
  width,
  height,
}: {
  definition: EffectDefinition;
  effectParams: ParamValues;
  width: number;
  height: number;
}): EffectPass[] {
  if (definition.renderer.buildPasses) {
    return definition.renderer.buildPasses({ effectParams, width, height });
  }
  return definition.renderer.passes.map((pass) => ({
    shader: pass.shader,
    uniforms: pass.uniforms({ effectParams, width, height }),
  }));
}

export const EFFECT_TARGET_ELEMENT_TYPES = VISUAL_ELEMENT_TYPES;

export function buildDefaultEffectInstance({
  effectType,
}: {
  effectType: string;
}): Effect {
  const definition = effectsRegistry.get(effectType);
  const params: ParamValues = buildDefaultParamValues(definition.params);

  return {
    id: generateUUID(),
    type: effectType,
    params,
    enabled: true,
  };
}
