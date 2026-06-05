import type {
  AnimationPath,
  ElementAnimations,
  ChannelData,
  ScalarAnimationChannel,
  ScalarGraphChannel,
  ScalarGraphKeyframeContext,
} from "./types";
import type { ChannelEasingMode } from "../params";
import { isCompositeChannelData, isLeafChannelData } from "./channel-data";
import { isScalarChannel } from "./interpolation";

// Lens over ElementAnimations that exposes only the scalar channels
// the curve graph editor can edit (handles, tangents, etc.). Composite
// (RGBA) channels are flattened into per-component scalar channels;
// callers see them as four siblings under r/g/b/a componentKeys.

export interface EditableScalarChannels {
  easingMode: ChannelEasingMode;
  channels: ScalarGraphChannel[];
}

function isScalarAnimationChannel(
  channel: ChannelData | undefined,
): channel is ScalarAnimationChannel {
  return isLeafChannelData(channel) && isScalarChannel(channel);
}

function getEasingModeForChannelData({
  data,
}: {
  data: ChannelData | undefined;
}): ChannelEasingMode {
  return isCompositeChannelData(data) &&
    ["r", "g", "b", "a"].every((componentKey) => componentKey in data)
    ? "shared"
    : "independent";
}

export function getEditableScalarChannels({
  animations,
  propertyPath,
}: {
  animations: ElementAnimations | undefined;
  propertyPath: AnimationPath;
}): EditableScalarChannels | null {
  const data = animations?.[propertyPath];
  if (!data) {
    return null;
  }

  const channelEntries: Array<[string, ChannelData | undefined]> =
    isLeafChannelData(data)
      ? [["value", data]]
      : Object.entries(data);
  const channels: ScalarGraphChannel[] = [];
  for (const [componentKey, channel] of channelEntries) {
    if (!isScalarAnimationChannel(channel)) {
      continue;
    }
    channels.push({ propertyPath, componentKey, channel });
  }

  return { easingMode: getEasingModeForChannelData({ data }), channels };
}

export function getEditableScalarChannel({
  animations,
  propertyPath,
  componentKey,
}: {
  animations: ElementAnimations | undefined;
  propertyPath: AnimationPath;
  componentKey: string;
}): ScalarGraphChannel | null {
  const result = getEditableScalarChannels({ animations, propertyPath });
  return result?.channels.find((channel) => channel.componentKey === componentKey) ?? null;
}

export function getScalarKeyframeContext({
  animations,
  propertyPath,
  componentKey,
  keyframeId,
}: {
  animations: ElementAnimations | undefined;
  propertyPath: AnimationPath;
  componentKey: string;
  keyframeId: string;
}): ScalarGraphKeyframeContext | null {
  const scalarChannel = getEditableScalarChannel({
    animations,
    propertyPath,
    componentKey,
  });
  if (!scalarChannel) {
    return null;
  }

  const keyframeIndex = scalarChannel.channel.keys.findIndex(
    (keyframe) => keyframe.id === keyframeId,
  );
  if (keyframeIndex < 0) {
    return null;
  }

  return {
    ...scalarChannel,
    keyframe: scalarChannel.channel.keys[keyframeIndex],
    keyframeIndex,
    previousKey: scalarChannel.channel.keys[keyframeIndex - 1] ?? null,
    nextKey: scalarChannel.channel.keys[keyframeIndex + 1] ?? null,
  };
}
