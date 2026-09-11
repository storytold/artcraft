import type { AnimationPath, AnimationPropertyPath } from "./types";
import { ANIMATION_PROPERTY_PATHS } from "./types";
import { isEffectParamPath } from "./effect-param-channel";
import { isGraphicParamPath } from "./graphic-param-channel";

// AnimationPath discriminator. A path is one of:
//   - a known transform/opacity property (ANIMATION_PROPERTY_PATHS)
//   - a graphic param path: "params.<key>"
//   - an effect param path: "effects.<effectId>.params.<key>"
// isAnimationPath returns true for any of them; the more specific
// guards live in path-name-channel modules.

const ANIMATION_PROPERTY_PATH_SET = new Set<string>(ANIMATION_PROPERTY_PATHS);

export function isAnimationPropertyPath(
  propertyPath: string,
): propertyPath is AnimationPropertyPath {
  return ANIMATION_PROPERTY_PATH_SET.has(propertyPath);
}

export function isAnimationPath(
  propertyPath: string,
): propertyPath is AnimationPath {
  return (
    isAnimationPropertyPath(propertyPath) ||
    isGraphicParamPath(propertyPath) ||
    isEffectParamPath(propertyPath)
  );
}
