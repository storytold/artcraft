import type {
  ElementAnimations,
  EffectParamPath,
} from "./types";
import type { ParamValues } from "../params";
import { removeElementKeyframe } from "./keyframes";
import { resolveAnimationPathValueAtTime } from "./resolve";

// Effect parameters animate via paths of the form
//   "effects.<effectId>.params.<paramKey>"
// stored in element.animations. The helpers here pack/unpack that
// scheme so callers in the effects subsystem don't string-concat
// raw paths.

export const EFFECT_PARAM_PATH_PREFIX = "effects.";
export const EFFECT_PARAM_PATH_SUFFIX = ".params.";

export function buildEffectParamPath({
  effectId,
  paramKey,
}: {
  effectId: string;
  paramKey: string;
}): EffectParamPath {
  return `${EFFECT_PARAM_PATH_PREFIX}${effectId}${EFFECT_PARAM_PATH_SUFFIX}${paramKey}`;
}

export function isEffectParamPath(
  propertyPath: string,
): propertyPath is EffectParamPath {
  return (
    propertyPath.startsWith(EFFECT_PARAM_PATH_PREFIX) &&
    propertyPath.includes(EFFECT_PARAM_PATH_SUFFIX)
  );
}

export function parseEffectParamPath({
  propertyPath,
}: {
  propertyPath: string;
}): { effectId: string; paramKey: string } | null {
  if (!isEffectParamPath(propertyPath)) {
    return null;
  }

  const withoutPrefix = propertyPath.slice(EFFECT_PARAM_PATH_PREFIX.length);
  const separatorIndex = withoutPrefix.indexOf(EFFECT_PARAM_PATH_SUFFIX);
  if (separatorIndex <= 0) {
    return null;
  }

  const effectId = withoutPrefix.slice(0, separatorIndex);
  const paramKey = withoutPrefix.slice(
    separatorIndex + EFFECT_PARAM_PATH_SUFFIX.length,
  );
  if (!effectId || !paramKey) {
    return null;
  }

  return { effectId, paramKey };
}

export function resolveEffectParamsAtTime({
  effectId,
  params,
  animations,
  localTime,
}: {
  effectId: string;
  params: ParamValues;
  animations: ElementAnimations | undefined;
  localTime: number;
}): ParamValues {
  const safeLocalTime = Math.max(0, localTime);
  const resolved: ParamValues = {};

  for (const [paramKey, staticValue] of Object.entries(params)) {
    const path = buildEffectParamPath({ effectId, paramKey });
    resolved[paramKey] = animations?.[path]
      ? resolveAnimationPathValueAtTime({
          animations,
          propertyPath: path,
          localTime: safeLocalTime,
          fallbackValue: staticValue,
        })
      : staticValue;
  }

  return resolved;
}

export function removeEffectParamKeyframe({
  animations,
  effectId,
  paramKey,
  keyframeId,
}: {
  animations: ElementAnimations | undefined;
  effectId: string;
  paramKey: string;
  keyframeId: string;
}): ElementAnimations | undefined {
  return removeElementKeyframe({
    animations,
    propertyPath: buildEffectParamPath({ effectId, paramKey }),
    keyframeId,
  });
}
