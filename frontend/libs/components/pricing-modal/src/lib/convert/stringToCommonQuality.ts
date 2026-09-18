import { CommonQuality } from "@storyteller/api-enums";

/**
 * Convert a quality value to CommonQuality for the image cost estimate API.
 *
 * Preserves all API quality tiers, including values added after this build.
 */
export function stringToCommonQuality(
  quality: string | undefined,
): string | null {
  switch (quality) {
    case "auto":
      return CommonQuality.Auto;
    case "max":
      return CommonQuality.Max;
    case "xhigh":
      return CommonQuality.XHigh;
    case "high":
      return CommonQuality.High;
    case "medium":
      return CommonQuality.Medium;
    case "low":
      return CommonQuality.Low;
    default:
      return quality ?? null;
  }
}
