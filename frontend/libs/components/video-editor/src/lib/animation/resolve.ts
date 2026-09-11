import type {
  AnimationPath,
  ElementAnimations,
} from "./types";
import { formatLinearRgba, parseColorToLinearRgba } from "../params";
import type { ParamValue } from "../params";
import { isCompositeChannelData, isLeafChannelData } from "./channel-data";
import {
  getChannelValueAtTime,
  isScalarChannel,
} from "./interpolation";

// Computes the resolved param value at a given local time, accounting
// for animations. The path can address a leaf channel (single value)
// or a composite channel (RGBA color, decomposed into 4 scalar
// sub-channels at the lib's render boundary).
//
// localTime is element-local: 0 at the element's start, clamped to
// [0, duration] at the edges. getElementLocalTime maps from timeline
// time to local time.

export function getElementLocalTime({
  timelineTime,
  elementStartTime,
  elementDuration,
}: {
  timelineTime: number;
  elementStartTime: number;
  elementDuration: number;
}): number {
  const localTime = timelineTime - elementStartTime;
  if (localTime <= 0) {
    return 0;
  }

  if (localTime >= elementDuration) {
    return elementDuration;
  }

  return localTime;
}

export function resolveAnimationPathValueAtTime({
  animations,
  propertyPath,
  localTime,
  fallbackValue,
}: {
  animations: ElementAnimations | undefined;
  propertyPath: AnimationPath;
  localTime: number;
  fallbackValue: number;
}): number;
export function resolveAnimationPathValueAtTime({
  animations,
  propertyPath,
  localTime,
  fallbackValue,
}: {
  animations: ElementAnimations | undefined;
  propertyPath: AnimationPath;
  localTime: number;
  fallbackValue: string;
}): string;
export function resolveAnimationPathValueAtTime({
  animations,
  propertyPath,
  localTime,
  fallbackValue,
}: {
  animations: ElementAnimations | undefined;
  propertyPath: AnimationPath;
  localTime: number;
  fallbackValue: boolean;
}): boolean;
export function resolveAnimationPathValueAtTime({
  animations,
  propertyPath,
  localTime,
  fallbackValue,
}: {
  animations: ElementAnimations | undefined;
  propertyPath: AnimationPath;
  localTime: number;
  fallbackValue: ParamValue;
}): ParamValue;
export function resolveAnimationPathValueAtTime({
  animations,
  propertyPath,
  localTime,
  fallbackValue,
}: {
  animations: ElementAnimations | undefined;
  propertyPath: AnimationPath;
  localTime: number;
  fallbackValue: ParamValue;
}): ParamValue {
  const data = animations?.[propertyPath];
  if (!data) {
    return fallbackValue;
  }
  if (isLeafChannelData(data)) {
    if (typeof fallbackValue === "number") {
      return getChannelValueAtTime({
        channel: isScalarChannel(data) ? data : undefined,
        time: localTime,
        fallbackValue,
      });
    }
    if (typeof fallbackValue === "string" || typeof fallbackValue === "boolean") {
      return getChannelValueAtTime({
        channel: !isScalarChannel(data) ? data : undefined,
        time: localTime,
        fallbackValue,
      });
    }
    return fallbackValue;
  }
  if (!isCompositeChannelData(data)) {
    return fallbackValue;
  }

  if (
    typeof fallbackValue !== "string" ||
    !("r" in data) ||
    !("g" in data) ||
    !("b" in data) ||
    !("a" in data)
  ) {
    return fallbackValue;
  }

  const fallbackComponents = parseColorToLinearRgba({ color: fallbackValue });
  if (fallbackComponents === null) {
    return fallbackValue;
  }

  return formatLinearRgba({
    color: {
      r: getChannelValueAtTime({
        channel: data.r && isScalarChannel(data.r) ? data.r : undefined,
        time: localTime,
        fallbackValue: fallbackComponents.r,
      }),
      g: getChannelValueAtTime({
        channel: data.g && isScalarChannel(data.g) ? data.g : undefined,
        time: localTime,
        fallbackValue: fallbackComponents.g,
      }),
      b: getChannelValueAtTime({
        channel: data.b && isScalarChannel(data.b) ? data.b : undefined,
        time: localTime,
        fallbackValue: fallbackComponents.b,
      }),
      a: getChannelValueAtTime({
        channel: data.a && isScalarChannel(data.a) ? data.a : undefined,
        time: localTime,
        fallbackValue: fallbackComponents.a,
      }),
    },
  });
}
