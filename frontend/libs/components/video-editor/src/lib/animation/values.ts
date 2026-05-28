import type {
  AnimationColorPropertyPath,
  AnimationNumericPropertyPath,
  ElementAnimations,
} from "./types";
import { resolveAnimationPathValueAtTime } from "./resolve";

// Thin wrappers over resolveAnimationPathValueAtTime that constrain the
// propertyPath to the right type-family (numeric vs color), so callers
// don't have to cast their fallback values at the boundary.

export function resolveOpacityAtTime({
  baseOpacity,
  animations,
  localTime,
}: {
  baseOpacity: number;
  animations: ElementAnimations | undefined;
  localTime: number;
}): number {
  return resolveAnimationPathValueAtTime({
    animations,
    propertyPath: "opacity",
    localTime: Math.max(0, localTime),
    fallbackValue: baseOpacity,
  });
}

export function resolveNumberAtTime({
  baseValue,
  animations,
  propertyPath,
  localTime,
}: {
  baseValue: number;
  animations: ElementAnimations | undefined;
  propertyPath: AnimationNumericPropertyPath;
  localTime: number;
}): number {
  return resolveAnimationPathValueAtTime({
    animations,
    propertyPath,
    localTime: Math.max(0, localTime),
    fallbackValue: baseValue,
  });
}

export function resolveColorAtTime({
  baseColor,
  animations,
  propertyPath,
  localTime,
}: {
  baseColor: string;
  animations: ElementAnimations | undefined;
  propertyPath: AnimationColorPropertyPath;
  localTime: number;
}): string {
  return resolveAnimationPathValueAtTime({
    animations,
    propertyPath,
    localTime: Math.max(0, localTime),
    fallbackValue: baseColor,
  });
}
