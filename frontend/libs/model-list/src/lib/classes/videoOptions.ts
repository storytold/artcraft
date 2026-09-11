import type { VideoModel } from "./VideoModel.js";

/** Normalize old display values while preserving future API values. */
export function videoResolutionValue(value: string): string {
  const legacy: Record<string, string> = {
    "480p": "four_eighty_p",
    "720p": "seven_twenty_p",
    "1080p": "ten_eighty_p",
    "1k": "one_k",
    "2k": "two_k",
    "2K": "two_k",
    "3k": "three_k",
    "4k": "four_k",
    "4K": "four_k",
  };
  return legacy[value] ?? value;
}

export function videoDurationRange(
  model: VideoModel,
  referenceMode: boolean,
): { min: number; max: number } | null {
  const max = referenceMode
    ? (model.maxDurationWithImageReferences ?? model.maxDuration)
    : model.maxDuration;
  if (model.minDuration != null && max != null) {
    return { min: model.minDuration, max };
  }
  const options = model.durationOptions;
  return options?.length
    ? { min: Math.min(...options), max: Math.max(...options) }
    : null;
}

/** Match the web prompt box: clamp ranges, snap sparse lists, retain defaults. */
export function resolveVideoDuration(
  model: VideoModel,
  current: number | null,
  referenceMode: boolean,
): number | null {
  const value = current ?? model.defaultDuration;
  if (value == null) return null;
  const range = videoDurationRange(model, referenceMode);
  if (range && model.minDuration != null) {
    return Math.min(Math.max(value, range.min), range.max);
  }
  if (model.durationOptions?.length) {
    return model.durationOptions.reduce((best, option) => {
      const distance = Math.abs(option - value);
      const bestDistance = Math.abs(best - value);
      return distance < bestDistance ||
        (distance === bestDistance && option > best)
        ? option
        : best;
    });
  }
  return model.defaultDuration ?? null;
}
