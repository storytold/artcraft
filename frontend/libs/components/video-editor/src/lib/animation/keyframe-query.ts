import type {
  AnimationChannel,
  AnimationPath,
  ChannelData,
  ElementAnimations,
  ElementKeyframe,
} from "./types";
import { formatLinearRgba } from "../params";
import {
  getChannelEntriesFromData,
  isAnimationStorageKey,
} from "./channel-data";
import {
  getChannelValueAtTime,
  getScalarSegmentInterpolation,
  isScalarChannel,
} from "./interpolation";
import { isAnimationPath } from "./path";

// Read-only queries over element animations. The properties panel and
// the animation-snap-points module use these to list / find keyframes
// without going through the keyframes.ts mutation path.
//
// Composite (RGBA color) channels: getUniqueChannelKeyframeMatches
// dedupes by time so a single timestamp produces one ElementKeyframe
// even when each of r/g/b/a has its own key at that instant.

function getChannelFallbackValue({
  channel,
}: {
  channel: AnimationChannel;
}) {
  if (channel.keys.length === 0) {
    return isScalarChannel(channel) ? 0 : false;
  }

  return channel.keys[0].value;
}

interface ChannelKeyframeMatch {
  componentKey: string;
  componentIndex: number;
  channel: AnimationChannel;
  keyframe: AnimationChannel["keys"][number];
}

function getChannelKeyframeMatches({
  data,
}: {
  data: ChannelData | undefined;
}): ChannelKeyframeMatch[] {
  return getChannelEntriesFromData({ data }).flatMap(
    ([componentKey, channel], componentIndex) => {
      if (channel.keys.length === 0) {
        return [];
      }

      return channel.keys.map((keyframe) => ({
        componentKey,
        componentIndex,
        channel,
        keyframe,
      }));
    },
  );
}

function getUniqueChannelKeyframeMatches({
  data,
}: {
  data: ChannelData | undefined;
}): ChannelKeyframeMatch[] {
  const sortedMatches = getChannelKeyframeMatches({
    data,
  }).sort(
    (leftMatch, rightMatch) =>
      leftMatch.keyframe.time - rightMatch.keyframe.time ||
      leftMatch.componentIndex - rightMatch.componentIndex,
  );
  const uniqueMatches: ChannelKeyframeMatch[] = [];

  for (const match of sortedMatches) {
    const previousMatch = uniqueMatches[uniqueMatches.length - 1];
    if (
      !previousMatch ||
      previousMatch.keyframe.time !== match.keyframe.time
    ) {
      uniqueMatches.push(match);
      continue;
    }

    if (
      previousMatch.componentIndex !== 0 &&
      match.componentIndex === 0
    ) {
      uniqueMatches[uniqueMatches.length - 1] = match;
    }
  }

  return uniqueMatches;
}

function getPreferredChannelKeyframeMatch({
  matches,
}: {
  matches: ChannelKeyframeMatch[];
}): ChannelKeyframeMatch | null {
  return (
    matches.find((match) => match.componentIndex === 0) ??
    matches[0] ??
    null
  );
}

function getChannelValue({
  channel,
  time,
}: {
  channel: AnimationChannel;
  time: number;
}) {
  const fallbackValue = getChannelFallbackValue({ channel });
  if (typeof fallbackValue === "number") {
    return getChannelValueAtTime({
      channel: isScalarChannel(channel) ? channel : undefined,
      time,
      fallbackValue,
    });
  }
  return getChannelValueAtTime({
    channel: !isScalarChannel(channel) ? channel : undefined,
    time,
    fallbackValue,
  });
}

function getComposedChannelDataValueAtTime({
  data,
  time,
}: {
  data: ChannelData | undefined;
  time: number;
}) {
  const entries = getChannelEntriesFromData({ data });
  if (entries.length === 0) {
    return null;
  }
  if (entries.length === 1 && entries[0]?.[0] === "value") {
    return getChannelValue({ channel: entries[0][1], time });
  }

  const componentValues = Object.fromEntries(
    entries.map(([componentKey, channel]) => [
      componentKey,
      getChannelValue({ channel, time }),
    ]),
  );
  if (
    typeof componentValues.r === "number" &&
    typeof componentValues.g === "number" &&
    typeof componentValues.b === "number" &&
    typeof componentValues.a === "number"
  ) {
    return formatLinearRgba({
      color: {
        r: componentValues.r,
        g: componentValues.g,
        b: componentValues.b,
        a: componentValues.a,
      },
    });
  }
  return null;
}

function getKeyframeInterpolation({
  channel,
  keyframe,
}: {
  channel: AnimationChannel;
  keyframe: AnimationChannel["keys"][number];
}) {
  return isScalarChannel(channel) && "segmentToNext" in keyframe
    ? getScalarSegmentInterpolation({ segment: keyframe.segmentToNext })
    : "hold";
}

function toElementKeyframe({
  data,
  propertyPath,
  keyframeMatch,
}: {
  data: ChannelData | undefined;
  propertyPath: AnimationPath;
  keyframeMatch: ChannelKeyframeMatch;
}): ElementKeyframe | null {
  const value = getComposedChannelDataValueAtTime({
    data,
    time: keyframeMatch.keyframe.time,
  });
  if (value === null) {
    return null;
  }

  return {
    propertyPath,
    id: keyframeMatch.keyframe.id,
    time: keyframeMatch.keyframe.time,
    value,
    interpolation: getKeyframeInterpolation({
      channel: keyframeMatch.channel,
      keyframe: keyframeMatch.keyframe,
    }),
  };
}

export function getElementKeyframes({
  animations,
}: {
  animations: ElementAnimations | undefined;
}): ElementKeyframe[] {
  if (!animations) {
    return [];
  }

  return Object.entries(animations).filter(([key]) =>
    isAnimationStorageKey({ key }),
  ).flatMap(
    ([propertyPath, data]) => {
      if (!data || !isAnimationPath(propertyPath)) {
        return [];
      }

      return getUniqueChannelKeyframeMatches({
        data,
      }).flatMap((keyframeMatch) => {
        const keyframe = toElementKeyframe({
          data,
          propertyPath,
          keyframeMatch,
        });
        if (!keyframe) {
          return [];
        }

        return [keyframe];
      });
    },
  );
}

export function hasKeyframesForPath({
  animations,
  propertyPath,
}: {
  animations: ElementAnimations | undefined;
  propertyPath: AnimationPath;
}): boolean {
  return getChannelEntriesFromData({ data: animations?.[propertyPath] }).some(
    ([, channel]) => channel.keys.length > 0,
  );
}

export function getKeyframeAtTime({
  animations,
  propertyPath,
  time,
}: {
  animations: ElementAnimations | undefined;
  propertyPath: AnimationPath;
  time: number;
}): ElementKeyframe | null {
  const data = animations?.[propertyPath];
  if (!data) {
    return null;
  }

  const keyframeMatch = getPreferredChannelKeyframeMatch({
    matches: getChannelKeyframeMatches({ data }).filter(
      ({ keyframe }) => keyframe.time === time,
    ),
  });
  if (!keyframeMatch) {
    return null;
  }

  return toElementKeyframe({
    data,
    propertyPath,
    keyframeMatch,
  });
}

export function getKeyframeById({
  animations,
  propertyPath,
  keyframeId,
}: {
  animations: ElementAnimations | undefined;
  propertyPath: AnimationPath;
  keyframeId: string;
}): ElementKeyframe | null {
  const data = animations?.[propertyPath];
  if (!data) {
    return null;
  }

  const keyframeMatch = getPreferredChannelKeyframeMatch({
    matches: getChannelKeyframeMatches({ data }).filter(
      ({ keyframe }) => keyframe.id === keyframeId,
    ),
  });
  if (!keyframeMatch) {
    return null;
  }

  return toElementKeyframe({
    data,
    propertyPath,
    keyframeMatch,
  });
}
