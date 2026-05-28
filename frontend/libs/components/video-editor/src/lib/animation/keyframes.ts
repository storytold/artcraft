import type {
  AnimationChannel,
  ChannelData,
  AnimationInterpolation,
  AnimationPath,
  DiscreteAnimationChannel,
  DiscreteAnimationKey,
  ElementAnimations,
  ScalarAnimationChannel,
  ScalarAnimationKey,
  ScalarCurveKeyframePatch,
  ScalarSegmentType,
} from "./types";
import type {
  ChannelComponentDefinition,
  ParamChannelLayout,
  ParamValue,
} from "../params";
import {
  getChannelsFromData,
  isCompositeChannelData,
  isAnimationStorageKey,
  isLeafChannelData,
} from "./channel-data";
import {
  getDefaultLeftHandle,
  getDefaultRightHandle,
  solveBezierProgressForTime,
} from "./bezier";
import {
  getChannelValueAtTime,
  getScalarSegmentInterpolation,
  isScalarChannel,
  normalizeChannel,
  normalizeDiscreteChannel,
  normalizeScalarChannel,
} from "./interpolation";
import {
  type MediaTime,
  roundMediaTime,
  subMediaTime,
  ZERO_MEDIA_TIME,
} from "../wasm";
import { generateUUID } from "../utils/id";

// Keyframe CRUD over the (composite-or-leaf) channel-data tree. The
// public API works in terms of ElementAnimations and AnimationPaths;
// callers do not touch the per-component channel shape directly.
//
// splitAnimationsAtTime is the trickiest — when the split lands inside
// a Bezier segment we use de Casteljau subdivision to produce two
// half-segments that exactly reproduce the original curve. Discrete
// channels just split at the boundary.

function isNearlySameTime({
  leftTime,
  rightTime,
}: {
  leftTime: number;
  rightTime: number;
}): boolean {
  return leftTime === rightTime;
}

function hasChannelKeys({
  channel,
}: {
  channel: AnimationChannel | undefined;
}): boolean {
  return Boolean(channel && channel.keys.length > 0);
}

function hasChannelData({ data }: { data: ChannelData | undefined }): boolean {
  return getChannelsFromData({ data }).some((channel) =>
    hasChannelKeys({ channel }),
  );
}

function toAnimation({
  animations,
}: {
  animations: ElementAnimations;
}): ElementAnimations | undefined {
  const nextAnimations = Object.fromEntries(
    Object.entries(animations).filter(
      ([key, data]) => isAnimationStorageKey({ key }) && hasChannelData({ data }),
    ),
  );
  if (Object.keys(nextAnimations).length === 0) {
    return undefined;
  }

  return nextAnimations;
}

function cloneAnimationsState({
  animations,
}: {
  animations: ElementAnimations | undefined;
}): ElementAnimations {
  return { ...(animations ?? {}) };
}

function getChannelFromData({
  data,
  componentKey,
}: {
  data: ChannelData | undefined;
  componentKey: string;
}): AnimationChannel | undefined {
  if (isLeafChannelData(data)) {
    return componentKey === "value" ? data : undefined;
  }
  if (isCompositeChannelData(data)) {
    return data[componentKey];
  }
  return undefined;
}

type LayoutComponent = ChannelComponentDefinition<string>;

function getLayoutComponents({
  channelLayout,
}: {
  channelLayout: ParamChannelLayout;
}): LayoutComponent[] {
  return channelLayout.kind === "leaf"
    ? [channelLayout.component]
    : channelLayout.components;
}

function getPrimaryComponentKey({
  channelLayout,
}: {
  channelLayout: ParamChannelLayout;
}): string {
  return getLayoutComponents({ channelLayout })[0]?.key ?? "value";
}

function getPrimaryChannelFromData({
  data,
  channelLayout,
}: {
  data: ChannelData | undefined;
  channelLayout: ParamChannelLayout;
}): AnimationChannel | undefined {
  return getChannelFromData({
    data,
    componentKey: getPrimaryComponentKey({ channelLayout }),
  });
}

function setChannelInData({
  data,
  componentKey,
  channel,
}: {
  data: ChannelData | undefined;
  componentKey: string;
  channel: AnimationChannel | undefined;
}): ChannelData | undefined {
  if (componentKey === "value") {
    return channel;
  }
  const components = isCompositeChannelData(data) ? { ...data } : {};
  if (channel && hasChannelKeys({ channel })) {
    components[componentKey] = channel;
  } else {
    delete components[componentKey];
  }
  return Object.keys(components).length > 0 ? components : undefined;
}

function getChannelDataEntries({
  data,
}: {
  data: ChannelData | undefined;
}): Array<[string, AnimationChannel | undefined]> {
  if (isLeafChannelData(data)) {
    return [["value", data]];
  }
  return isCompositeChannelData(data) ? Object.entries(data) : [];
}

function getScalarSegmentType({
  interpolation,
}: {
  interpolation: AnimationInterpolation;
}): ScalarSegmentType {
  if (interpolation === "hold") {
    return "step";
  }
  return interpolation === "bezier" ? "bezier" : "linear";
}

function getInterpolationForComponent({
  component,
  interpolation,
}: {
  component: LayoutComponent;
  interpolation: AnimationInterpolation | undefined;
}): AnimationInterpolation {
  if (component.valueKind === "discrete") {
    return "hold";
  }

  if (
    interpolation === "linear" ||
    interpolation === "hold" ||
    interpolation === "bezier"
  ) {
    return interpolation;
  }

  return component.defaultInterpolation;
}

function decomposeChannelLayoutValue({
  channelLayout,
  value,
}: {
  channelLayout: ParamChannelLayout;
  value: ParamValue;
}): Record<string, ParamValue> | null {
  if (channelLayout.kind === "leaf") {
    return { [channelLayout.component.key]: value };
  }
  if (typeof value !== "string") {
    return null;
  }

  const components = channelLayout.decompose(value);
  return components ? { ...components } : null;
}

function createScalarKey({
  id,
  time,
  value,
  interpolation,
  previousKey,
}: {
  id: string;
  time: MediaTime;
  value: number;
  interpolation?: AnimationInterpolation;
  previousKey?: ScalarAnimationKey;
}): ScalarAnimationKey {
  return {
    id,
    time,
    value,
    leftHandle: previousKey?.leftHandle,
    rightHandle: previousKey?.rightHandle,
    segmentToNext:
      previousKey?.segmentToNext ??
      getScalarSegmentType({ interpolation: interpolation ?? "linear" }),
    tangentMode: previousKey?.tangentMode ?? "flat",
  };
}

function createDiscreteKey({
  id,
  time,
  value,
}: {
  id: string;
  time: MediaTime;
  value: string | boolean;
}): DiscreteAnimationKey {
  return {
    id,
    time,
    value,
  };
}

function isDiscreteChannel(
  channel: AnimationChannel | undefined,
): channel is DiscreteAnimationChannel {
  return channel != null && !isScalarChannel(channel);
}

function getChannelData({
  animations,
  propertyPath,
}: {
  animations: ElementAnimations | undefined;
  propertyPath: AnimationPath;
}): ChannelData | undefined {
  return animations?.[propertyPath];
}

function getTargetKeyMetadata({
  channel,
  time,
  keyframeId,
}: {
  channel: AnimationChannel | undefined;
  time: MediaTime;
  keyframeId?: string;
}) {
  const normalizedChannel =
    channel != null ? normalizeChannel({ channel }) : undefined;
  const keys = normalizedChannel?.keys ?? [];
  if (keyframeId) {
    const keyById = keys.find((key) => key.id === keyframeId);
    if (keyById) {
      return {
        id: keyById.id,
        time,
      };
    }
  }

  const keyAtTime = keys.find((key) =>
    isNearlySameTime({ leftTime: key.time, rightTime: time }),
  );
  if (keyAtTime) {
    return {
      id: keyAtTime.id,
      time: keyAtTime.time,
    };
  }

  return {
    id: keyframeId ?? generateUUID(),
    time,
  };
}

function upsertDiscreteChannelKey({
  channel,
  time,
  value,
  keyframeId,
}: {
  channel: DiscreteAnimationChannel | undefined;
  time: MediaTime;
  value: string | boolean;
  keyframeId?: string;
}): DiscreteAnimationChannel {
  const normalizedChannel = normalizeDiscreteChannel({
    channel: channel ?? { keys: [] },
  });
  const keys = [...normalizedChannel.keys];
  if (keyframeId) {
    const existingIndex = keys.findIndex((key) => key.id === keyframeId);
    if (existingIndex >= 0) {
      keys[existingIndex] = createDiscreteKey({
        id: keys[existingIndex].id,
        time,
        value,
      });
      return normalizeDiscreteChannel({
        channel: { keys },
      });
    }
  }

  const existingAtTimeIndex = keys.findIndex((key) =>
    isNearlySameTime({ leftTime: key.time, rightTime: time }),
  );
  if (existingAtTimeIndex >= 0) {
    keys[existingAtTimeIndex] = createDiscreteKey({
      id: keys[existingAtTimeIndex].id,
      time: keys[existingAtTimeIndex].time,
      value,
    });
    return normalizeDiscreteChannel({
      channel: { keys },
    });
  }

  keys.push(
    createDiscreteKey({
      id: keyframeId ?? generateUUID(),
      time,
      value,
    }),
  );
  return normalizeDiscreteChannel({
    channel: { keys },
  });
}

function upsertScalarChannelKey({
  channel,
  time,
  value,
  interpolation,
  defaultInterpolation,
  keyframeId,
}: {
  channel: ScalarAnimationChannel | undefined;
  time: MediaTime;
  value: number;
  interpolation?: AnimationInterpolation;
  defaultInterpolation?: AnimationInterpolation;
  keyframeId?: string;
}): ScalarAnimationChannel {
  const normalizedChannel = normalizeScalarChannel({
    channel: channel ?? { keys: [] },
  });
  const keys = [...normalizedChannel.keys];
  if (keyframeId) {
    const existingIndex = keys.findIndex((key) => key.id === keyframeId);
    if (existingIndex >= 0) {
      keys[existingIndex] = createScalarKey({
        id: keys[existingIndex].id,
        time,
        value,
        interpolation,
        previousKey:
          interpolation != null
            ? {
                ...keys[existingIndex],
                segmentToNext: getScalarSegmentType({ interpolation }),
              }
            : keys[existingIndex],
      });
      return normalizeScalarChannel({
        channel: {
          keys,
          extrapolation: normalizedChannel.extrapolation,
        },
      });
    }
  }

  const existingAtTimeIndex = keys.findIndex((key) =>
    isNearlySameTime({ leftTime: key.time, rightTime: time }),
  );
  if (existingAtTimeIndex >= 0) {
    keys[existingAtTimeIndex] = createScalarKey({
      id: keys[existingAtTimeIndex].id,
      time: keys[existingAtTimeIndex].time,
      value,
      interpolation,
      previousKey:
        interpolation != null
          ? {
              ...keys[existingAtTimeIndex],
              segmentToNext: getScalarSegmentType({ interpolation }),
            }
          : keys[existingAtTimeIndex],
    });
    return normalizeScalarChannel({
      channel: {
        keys,
        extrapolation: normalizedChannel.extrapolation,
      },
    });
  }

  keys.push(
    createScalarKey({
      id: keyframeId ?? generateUUID(),
      time,
      value,
      interpolation: interpolation ?? defaultInterpolation,
    }),
  );
  return normalizeScalarChannel({
    channel: {
      keys,
      extrapolation: normalizedChannel.extrapolation,
    },
  });
}

export function getChannel({
  animations,
  propertyPath,
}: {
  animations: ElementAnimations | undefined;
  propertyPath: AnimationPath;
}): AnimationChannel | undefined {
  const data = getChannelData({ animations, propertyPath });
  if (isLeafChannelData(data)) {
    return data;
  }
  return getChannelsFromData({ data })[0];
}

export function upsertPathKeyframe({
  animations,
  propertyPath,
  time,
  value,
  interpolation,
  keyframeId,
  channelLayout,
  coerceValue,
}: {
  animations: ElementAnimations | undefined;
  propertyPath: AnimationPath;
  time: MediaTime;
  value: ParamValue;
  interpolation?: AnimationInterpolation;
  keyframeId?: string;
  channelLayout: ParamChannelLayout;
  coerceValue: ({ value }: { value: ParamValue }) => ParamValue | null;
}): ElementAnimations | undefined {
  const coercedValue = coerceValue({ value });
  if (coercedValue === null) {
    return animations;
  }

  const nextAnimations = cloneAnimationsState({ animations });
  const currentData = getChannelData({ animations, propertyPath });
  const primaryChannel = getPrimaryChannelFromData({
    data: currentData,
    channelLayout,
  });
  const targetKey = getTargetKeyMetadata({
    channel: primaryChannel,
    time,
    keyframeId,
  });
  const componentValues = decomposeChannelLayoutValue({
    channelLayout,
    value: coercedValue,
  });
  if (!componentValues) {
    return animations;
  }

  let nextData: ChannelData | undefined = currentData;
  for (const component of getLayoutComponents({ channelLayout })) {
    const componentKey = component.key;
    const nextValue = componentValues[componentKey];
    if (nextValue == null) {
      continue;
    }

    const currentChannel = getChannelFromData({
      data: currentData,
      componentKey,
    });
    if (component.valueKind === "discrete") {
      if (typeof nextValue !== "string" && typeof nextValue !== "boolean") {
        continue;
      }
      const nextChannel = upsertDiscreteChannelKey({
        channel: isDiscreteChannel(currentChannel) ? currentChannel : undefined,
        time: targetKey.time,
        value: nextValue,
        keyframeId: targetKey.id,
      });
      nextData = setChannelInData({
        data: nextData,
        componentKey,
        channel: nextChannel,
      });
      continue;
    }

    if (typeof nextValue !== "number") {
      continue;
    }
    const nextChannel = upsertScalarChannelKey({
      channel:
        currentChannel != null && isScalarChannel(currentChannel)
          ? currentChannel
          : undefined,
      time: targetKey.time,
      value: nextValue,
      interpolation:
        interpolation != null
          ? getInterpolationForComponent({ component, interpolation })
          : undefined,
      defaultInterpolation: component.defaultInterpolation,
      keyframeId: targetKey.id,
    });
    nextData = setChannelInData({
      data: nextData,
      componentKey,
      channel: nextChannel,
    });
  }
  nextAnimations[propertyPath] = nextData;

  return toAnimation({
    animations: nextAnimations,
  });
}

export function upsertKeyframe({
  channel,
  time,
  value,
  interpolation,
  keyframeId,
}: {
  channel: AnimationChannel | undefined;
  time: MediaTime;
  value: ParamValue;
  interpolation?: AnimationInterpolation;
  keyframeId?: string;
}): AnimationChannel | undefined {
  if (!channel) {
    return undefined;
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return upsertDiscreteChannelKey({
      channel: isDiscreteChannel(channel) ? channel : undefined,
      time,
      value,
      keyframeId,
    });
  }

  if (typeof value !== "number") {
    return channel;
  }

  return upsertScalarChannelKey({
    channel: isScalarChannel(channel) ? channel : undefined,
    time,
    value,
    interpolation,
    keyframeId,
  });
}

export function removeKeyframe({
  channel,
  keyframeId,
}: {
  channel: AnimationChannel | undefined;
  keyframeId: string;
}): AnimationChannel | undefined {
  if (!channel) {
    return undefined;
  }

  if (isScalarChannel(channel)) {
    const nextKeys = channel.keys.filter((keyframe) => keyframe.id !== keyframeId);
    if (nextKeys.length === 0) {
      return undefined;
    }

    return normalizeScalarChannel({
      channel: {
        ...channel,
        keys: nextKeys,
      },
    });
  }

  const nextKeys = channel.keys.filter((keyframe) => keyframe.id !== keyframeId);
  if (nextKeys.length === 0) {
    return undefined;
  }

  return normalizeDiscreteChannel({
    channel: {
      ...channel,
      keys: nextKeys,
    },
  });
}

export function retimeKeyframe({
  channel,
  keyframeId,
  time,
}: {
  channel: AnimationChannel | undefined;
  keyframeId: string;
  time: MediaTime;
}): AnimationChannel | undefined {
  if (!channel) {
    return undefined;
  }

  if (isScalarChannel(channel)) {
    const keyframeByIdIndex = channel.keys.findIndex(
      (keyframe) => keyframe.id === keyframeId,
    );
    if (keyframeByIdIndex < 0) {
      return channel;
    }

    const nextKeys = [...channel.keys];
    nextKeys[keyframeByIdIndex] = {
      ...nextKeys[keyframeByIdIndex],
      time,
    };

    return normalizeScalarChannel({
      channel: {
        ...channel,
        keys: nextKeys,
      },
    });
  }

  const keyframeByIdIndex = channel.keys.findIndex(
    (keyframe) => keyframe.id === keyframeId,
  );
  if (keyframeByIdIndex < 0) {
    return channel;
  }

  const nextKeys = [...channel.keys];
  nextKeys[keyframeByIdIndex] = {
    ...nextKeys[keyframeByIdIndex],
    time,
  };

  return normalizeDiscreteChannel({
    channel: {
      ...channel,
      keys: nextKeys,
    },
  });
}

export function setChannel({
  animations,
  propertyPath,
  channel,
}: {
  animations: ElementAnimations | undefined;
  propertyPath: AnimationPath;
  channel: AnimationChannel | undefined;
}): ElementAnimations | undefined {
  return setBindingComponentChannel({
    animations,
    propertyPath,
    componentKey: "value",
    channel,
  });
}

export function setBindingComponentChannel({
  animations,
  propertyPath,
  componentKey,
  channel,
}: {
  animations: ElementAnimations | undefined;
  propertyPath: AnimationPath;
  componentKey: string;
  channel: AnimationChannel | undefined;
}): ElementAnimations | undefined {
  const nextAnimations = cloneAnimationsState({ animations });
  nextAnimations[propertyPath] = setChannelInData({
    data: nextAnimations[propertyPath],
    componentKey,
    channel:
      channel && hasChannelKeys({ channel })
        ? normalizeChannel({ channel })
        : undefined,
  });
  return toAnimation({
    animations: nextAnimations,
  });
}

export function updateScalarKeyframeCurve({
  animations,
  propertyPath,
  componentKey,
  keyframeId,
  patch,
}: {
  animations: ElementAnimations | undefined;
  propertyPath: AnimationPath;
  componentKey: string;
  keyframeId: string;
  patch: ScalarCurveKeyframePatch;
}): ElementAnimations | undefined {
  const channel = getChannelFromData({
    data: getChannelData({ animations, propertyPath }),
    componentKey,
  });
  if (!channel || !isScalarChannel(channel)) {
    return animations;
  }

  const keyframeIndex = channel.keys.findIndex((keyframe) => keyframe.id === keyframeId);
  if (keyframeIndex < 0) {
    return animations;
  }

  const nextKeys = [...channel.keys];
  const currentKey = nextKeys[keyframeIndex];
  nextKeys[keyframeIndex] = {
    ...currentKey,
    leftHandle:
      patch.leftHandle === undefined
        ? currentKey.leftHandle
        : patch.leftHandle ?? undefined,
    rightHandle:
      patch.rightHandle === undefined
        ? currentKey.rightHandle
        : patch.rightHandle ?? undefined,
    segmentToNext: patch.segmentToNext ?? currentKey.segmentToNext,
    tangentMode: patch.tangentMode ?? currentKey.tangentMode,
  };

  return setBindingComponentChannel({
    animations,
    propertyPath,
    componentKey,
    channel: {
      keys: nextKeys,
      extrapolation: channel.extrapolation,
    },
  });
}

function cloneChannelWithKeyIds({
  channel,
  keyIdMap,
}: {
  channel: AnimationChannel;
  keyIdMap: Map<string, string>;
}): AnimationChannel {
  return isScalarChannel(channel)
    ? normalizeScalarChannel({
        channel: {
          ...channel,
          keys: channel.keys.map((key) => ({
            ...key,
            id: keyIdMap.get(key.id) ?? key.id,
          })),
        },
      })
    : normalizeDiscreteChannel({
        channel: {
          ...channel,
          keys: channel.keys.map((key) => ({
            ...key,
            id: keyIdMap.get(key.id) ?? key.id,
          })),
        },
      });
}

export function cloneAnimations({
  animations,
  shouldRegenerateKeyframeIds = false,
}: {
  animations: ElementAnimations | undefined;
  shouldRegenerateKeyframeIds?: boolean;
}): ElementAnimations | undefined {
  if (!animations) {
    return undefined;
  }

  const nextAnimations = cloneAnimationsState({ animations });
  for (const [propertyPath, data] of Object.entries(animations).filter(([key]) =>
    isAnimationStorageKey({ key }),
  )) {
    const channels = getChannelsFromData({ data });
    const primaryChannel = channels[0];
    const keyIdMap = new Map<string, string>();
    if (primaryChannel) {
      for (const key of primaryChannel.keys) {
        keyIdMap.set(
          key.id,
          shouldRegenerateKeyframeIds ? generateUUID() : key.id,
        );
      }
    }

    if (isLeafChannelData(data)) {
      nextAnimations[propertyPath] = cloneChannelWithKeyIds({
        channel: data,
        keyIdMap,
      });
      continue;
    }
    if (isCompositeChannelData(data)) {
      nextAnimations[propertyPath] = Object.fromEntries(
        Object.entries(data).map(([componentKey, channel]) => [
          componentKey,
          channel
            ? cloneChannelWithKeyIds({ channel, keyIdMap })
            : undefined,
        ]),
      );
    }
  }

  return toAnimation({
    animations: nextAnimations,
  });
}

export function clampAnimationsToDuration({
  animations,
  duration,
}: {
  animations: ElementAnimations | undefined;
  duration: MediaTime;
}): ElementAnimations | undefined {
  if (!animations || duration <= 0) {
    return undefined;
  }

  return splitAnimationsAtTime({
    animations,
    splitTime: duration,
    shouldIncludeSplitBoundary: true,
  }).leftAnimations;
}

function lerpPoint({
  left,
  right,
  progress,
}: {
  left: { x: number; y: number };
  right: { x: number; y: number };
  progress: number;
}) {
  return {
    x: left.x + (right.x - left.x) * progress,
    y: left.y + (right.y - left.y) * progress,
  };
}

function splitDiscreteChannelAtTime({
  channel,
  splitTime,
  leftBoundaryId,
  rightBoundaryId,
  shouldIncludeSplitBoundary,
}: {
  channel: DiscreteAnimationChannel | undefined;
  splitTime: MediaTime;
  leftBoundaryId: string;
  rightBoundaryId: string;
  shouldIncludeSplitBoundary: boolean;
}) {
  if (!channel || channel.keys.length === 0) {
    return {
      leftChannel: undefined,
      rightChannel: undefined,
    };
  }

  const normalizedChannel = normalizeChannel({ channel });
  let leftKeys = normalizedChannel.keys.filter((key) => key.time <= splitTime);
  let rightKeys = normalizedChannel.keys
    .filter((key) => key.time >= splitTime)
    .map((key) => ({
      ...key,
      time: subMediaTime({ a: key.time, b: splitTime }),
    }));

  if (shouldIncludeSplitBoundary) {
    const hasBoundaryOnLeft = leftKeys.some((key) =>
      isNearlySameTime({ leftTime: key.time, rightTime: splitTime }),
    );
    const hasBoundaryOnRight = rightKeys.some((key) =>
      isNearlySameTime({ leftTime: key.time, rightTime: 0 }),
    );
    const boundaryValue = getChannelValueAtTime({
      channel: normalizedChannel,
      time: splitTime,
      fallbackValue: normalizedChannel.keys[0].value,
    });
    if (!hasBoundaryOnLeft) {
      leftKeys = [
        ...leftKeys,
        createDiscreteKey({
          id: leftBoundaryId,
          time: splitTime,
          value: boundaryValue,
        }),
      ];
    }
    if (!hasBoundaryOnRight) {
      rightKeys = [
        createDiscreteKey({
          id: rightBoundaryId,
          time: ZERO_MEDIA_TIME,
          value: boundaryValue,
        }),
        ...rightKeys,
      ];
    }
  }

  return {
    leftChannel: leftKeys.length
      ? normalizeChannel({ channel: { keys: leftKeys } })
      : undefined,
    rightChannel: rightKeys.length
      ? normalizeChannel({ channel: { keys: rightKeys } })
      : undefined,
  };
}

function splitScalarChannelAtTime({
  channel,
  splitTime,
  leftBoundaryId,
  rightBoundaryId,
  shouldIncludeSplitBoundary,
}: {
  channel: ScalarAnimationChannel | undefined;
  splitTime: MediaTime;
  leftBoundaryId: string;
  rightBoundaryId: string;
  shouldIncludeSplitBoundary: boolean;
}) {
  if (!channel || channel.keys.length === 0) {
    return {
      leftChannel: undefined,
      rightChannel: undefined,
    };
  }

  const normalizedChannel = normalizeChannel({ channel });
  let leftKeys = normalizedChannel.keys.filter((key) => key.time <= splitTime);
  let rightKeys = normalizedChannel.keys
    .filter((key) => key.time >= splitTime)
    .map((key) => ({
      ...key,
      time: subMediaTime({ a: key.time, b: splitTime }),
    }));

  const hasBoundaryOnLeft = leftKeys.some((key) =>
    isNearlySameTime({ leftTime: key.time, rightTime: splitTime }),
  );
  const hasBoundaryOnRight = rightKeys.some((key) =>
    isNearlySameTime({ leftTime: key.time, rightTime: 0 }),
  );
  if (!shouldIncludeSplitBoundary || (hasBoundaryOnLeft && hasBoundaryOnRight)) {
    return {
      leftChannel: leftKeys.length
        ? normalizeChannel({
            channel: {
              keys: leftKeys,
              extrapolation: normalizedChannel.extrapolation,
            },
          })
        : undefined,
      rightChannel: rightKeys.length
        ? normalizeChannel({
            channel: {
              keys: rightKeys,
              extrapolation: normalizedChannel.extrapolation,
            },
          })
        : undefined,
    };
  }

  // de Casteljau split for the Bezier segment containing splitTime.
  for (let keyIndex = 0; keyIndex < normalizedChannel.keys.length - 1; keyIndex++) {
    const leftKey = normalizedChannel.keys[keyIndex];
    const rightKey = normalizedChannel.keys[keyIndex + 1];
    if (
      !(
        splitTime > leftKey.time &&
        splitTime < rightKey.time
      )
    ) {
      continue;
    }

    const boundaryValue = getChannelValueAtTime({
      channel: normalizedChannel,
      time: splitTime,
      fallbackValue: leftKey.value,
    });

    if (leftKey.segmentToNext === "bezier") {
      const rightHandle =
        leftKey.rightHandle ?? getDefaultRightHandle({ leftKey, rightKey });
      const leftHandle =
        rightKey.leftHandle ?? getDefaultLeftHandle({ leftKey, rightKey });
      const progress = solveBezierProgressForTime({
        time: splitTime,
        leftKey,
        rightKey,
      });
      const p0 = { x: leftKey.time, y: leftKey.value };
      const p1 = {
        x: leftKey.time + rightHandle.dt,
        y: leftKey.value + rightHandle.dv,
      };
      const p2 = {
        x: rightKey.time + leftHandle.dt,
        y: rightKey.value + leftHandle.dv,
      };
      const p3 = { x: rightKey.time, y: rightKey.value };
      const q0 = lerpPoint({ left: p0, right: p1, progress });
      const q1 = lerpPoint({ left: p1, right: p2, progress });
      const q2 = lerpPoint({ left: p2, right: p3, progress });
      const r0 = lerpPoint({ left: q0, right: q1, progress });
      const r1 = lerpPoint({ left: q1, right: q2, progress });
      const splitPoint = lerpPoint({ left: r0, right: r1, progress });
      leftKeys = [
        ...normalizedChannel.keys.filter((key) => key.time < splitTime),
        {
          ...leftKey,
          rightHandle: {
            dt: roundMediaTime({ time: q0.x - p0.x }),
            dv: q0.y - p0.y,
          },
        },
        {
          id: leftBoundaryId,
          time: splitTime,
          value: boundaryValue,
          leftHandle: {
            dt: roundMediaTime({ time: r0.x - splitPoint.x }),
            dv: r0.y - splitPoint.y,
          },
          segmentToNext: leftKey.segmentToNext,
          tangentMode: leftKey.tangentMode,
        },
      ];
      rightKeys = [
        {
          id: rightBoundaryId,
          time: ZERO_MEDIA_TIME,
          value: boundaryValue,
          rightHandle: {
            dt: roundMediaTime({ time: r1.x - splitPoint.x }),
            dv: r1.y - splitPoint.y,
          },
          segmentToNext: "bezier",
          tangentMode: leftKey.tangentMode,
        },
        {
          ...rightKey,
          time: subMediaTime({ a: rightKey.time, b: splitTime }),
          leftHandle: {
            dt: roundMediaTime({ time: q2.x - p3.x }),
            dv: q2.y - p3.y,
          },
        },
        ...normalizedChannel.keys
          .filter((key) => key.time > rightKey.time)
          .map((key) => ({
            ...key,
            time: subMediaTime({ a: key.time, b: splitTime }),
          })),
      ];
    } else {
      leftKeys = [
        ...leftKeys,
        createScalarKey({
          id: leftBoundaryId,
          time: splitTime,
          value: boundaryValue,
          interpolation: "linear",
        }),
      ];
      rightKeys = [
        createScalarKey({
          id: rightBoundaryId,
          time: ZERO_MEDIA_TIME,
          value: boundaryValue,
          interpolation: getScalarSegmentInterpolation({
            segment: leftKey.segmentToNext,
          }),
        }),
        ...rightKeys,
      ];
    }

    return {
      leftChannel: normalizeChannel({
        channel: {
          keys: leftKeys,
          extrapolation: normalizedChannel.extrapolation,
        },
      }),
      rightChannel: normalizeChannel({
        channel: {
          keys: rightKeys,
          extrapolation: normalizedChannel.extrapolation,
        },
      }),
    };
  }

  return {
    leftChannel: leftKeys.length
      ? normalizeChannel({
          channel: {
            keys: leftKeys,
            extrapolation: normalizedChannel.extrapolation,
          },
        })
      : undefined,
    rightChannel: rightKeys.length
      ? normalizeChannel({
          channel: {
            keys: rightKeys,
            extrapolation: normalizedChannel.extrapolation,
          },
        })
      : undefined,
  };
}

function splitChannelAtTime({
  channel,
  splitTime,
  leftBoundaryId,
  rightBoundaryId,
  shouldIncludeSplitBoundary,
}: {
  channel: AnimationChannel | undefined;
  splitTime: MediaTime;
  leftBoundaryId: string;
  rightBoundaryId: string;
  shouldIncludeSplitBoundary: boolean;
}) {
  return channel != null && !isScalarChannel(channel)
    ? splitDiscreteChannelAtTime({
        channel,
        splitTime,
        leftBoundaryId,
        rightBoundaryId,
        shouldIncludeSplitBoundary,
      })
    : splitScalarChannelAtTime({
        channel:
          channel != null && isScalarChannel(channel) ? channel : undefined,
        splitTime,
        leftBoundaryId,
        rightBoundaryId,
        shouldIncludeSplitBoundary,
      });
}

export function splitAnimationsAtTime({
  animations,
  splitTime,
  shouldIncludeSplitBoundary = true,
}: {
  animations: ElementAnimations | undefined;
  splitTime: MediaTime;
  shouldIncludeSplitBoundary?: boolean;
}): {
  leftAnimations: ElementAnimations | undefined;
  rightAnimations: ElementAnimations | undefined;
} {
  if (!animations) {
    return { leftAnimations: undefined, rightAnimations: undefined };
  }

  const leftAnimations = cloneAnimationsState({ animations: undefined });
  const rightAnimations = cloneAnimationsState({ animations: undefined });

  for (const [propertyPath, data] of Object.entries(animations).filter(([key]) =>
    isAnimationStorageKey({ key }),
  )) {
    if (!data) {
      continue;
    }

    const leftBoundaryId = generateUUID();
    const rightBoundaryId = generateUUID();

    for (const [componentKey, channel] of getChannelDataEntries({ data })) {
      const splitResult = splitChannelAtTime({
        channel,
        splitTime,
        leftBoundaryId,
        rightBoundaryId,
        shouldIncludeSplitBoundary,
      });
      if (splitResult.leftChannel) {
        leftAnimations[propertyPath] = setChannelInData({
          data: leftAnimations[propertyPath],
          componentKey,
          channel: splitResult.leftChannel,
        });
      }
      if (splitResult.rightChannel) {
        rightAnimations[propertyPath] = setChannelInData({
          data: rightAnimations[propertyPath],
          componentKey,
          channel: splitResult.rightChannel,
        });
      }
    }
  }

  return {
    leftAnimations: toAnimation({ animations: leftAnimations }),
    rightAnimations: toAnimation({ animations: rightAnimations }),
  };
}

export function removeElementKeyframe({
  animations,
  propertyPath,
  keyframeId,
}: {
  animations: ElementAnimations | undefined;
  propertyPath: AnimationPath;
  keyframeId: string;
}): ElementAnimations | undefined {
  const data = getChannelData({ animations, propertyPath });
  if (!data) {
    return animations;
  }

  const nextAnimations = cloneAnimationsState({ animations });
  if (isLeafChannelData(data)) {
    nextAnimations[propertyPath] = removeKeyframe({ channel: data, keyframeId });
  } else if (isCompositeChannelData(data)) {
    let nextData: ChannelData | undefined = data;
    for (const [componentKey, channel] of Object.entries(data)) {
      nextData = setChannelInData({
        data: nextData,
        componentKey,
        channel: removeKeyframe({ channel, keyframeId }),
      });
    }
    nextAnimations[propertyPath] = nextData;
  }
  return toAnimation({
    animations: nextAnimations,
  });
}

export function retimeElementKeyframe({
  animations,
  propertyPath,
  keyframeId,
  time,
}: {
  animations: ElementAnimations | undefined;
  propertyPath: AnimationPath;
  keyframeId: string;
  time: MediaTime;
}): ElementAnimations | undefined {
  const data = getChannelData({ animations, propertyPath });
  if (!data) {
    return animations;
  }

  const nextAnimations = cloneAnimationsState({ animations });
  if (isLeafChannelData(data)) {
    nextAnimations[propertyPath] = retimeKeyframe({
      channel: data,
      keyframeId,
      time,
    });
  } else if (isCompositeChannelData(data)) {
    let nextData: ChannelData | undefined = data;
    for (const [componentKey, channel] of Object.entries(data)) {
      nextData = setChannelInData({
        data: nextData,
        componentKey,
        channel: retimeKeyframe({ channel, keyframeId, time }),
      });
    }
    nextAnimations[propertyPath] = nextData;
  }
  return toAnimation({
    animations: nextAnimations,
  });
}
