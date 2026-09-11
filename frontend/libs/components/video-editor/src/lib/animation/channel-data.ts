import type {
  AnimationChannel,
  ChannelData,
  CompositeChannelData,
} from "./types";

// Tagged-union helpers for ChannelData. A param's animation storage is
// either a leaf channel (key array) or a composite (string-keyed
// record of leaf channels — used for colors which animate RGBA per
// component). These guards let callers handle both shapes without
// pattern-matching open-coded everywhere.
//
// `LEGACY_ANIMATION_STORAGE_KEYS` filters out two old storage-format
// keys that used to live alongside per-path channels at the same map
// level. Encountering them on read means the project was saved before
// the channel-data refactor — skip them rather than treat them as
// channels.

const LEGACY_ANIMATION_STORAGE_KEYS = new Set(["bindings", "channels"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isLeafChannelData(
  data: ChannelData | undefined,
): data is AnimationChannel {
  return isRecord(data) && Array.isArray(data.keys);
}

export function isCompositeChannelData(
  data: ChannelData | undefined,
): data is CompositeChannelData {
  return isRecord(data) && !Array.isArray(data.keys);
}

export function getChannelsFromData({
  data,
}: {
  data: ChannelData | undefined;
}): AnimationChannel[] {
  if (isLeafChannelData(data)) {
    return [data];
  }
  if (!isCompositeChannelData(data)) {
    return [];
  }
  return Object.values(data).filter(isLeafChannelData);
}

export function getChannelEntriesFromData({
  data,
}: {
  data: ChannelData | undefined;
}): Array<[string, AnimationChannel]> {
  if (isLeafChannelData(data)) {
    return [["value", data]];
  }
  if (!isCompositeChannelData(data)) {
    return [];
  }
  return Object.entries(data).flatMap(([componentKey, channel]) =>
    isLeafChannelData(channel) ? [[componentKey, channel]] : [],
  );
}

export function isAnimationStorageKey({ key }: { key: string }): boolean {
  return !LEGACY_ANIMATION_STORAGE_KEYS.has(key);
}
