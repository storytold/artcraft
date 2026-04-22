import { CommonQuality } from "@storyteller/api-enums";

/**
 * Convert a quality value to CommonQuality for the image cost estimate API.
 *
 * Accepts a CommonQuality string value from @storyteller/model-list ("high", "medium", "low").
 */
export function imageQualityToCommonQuality(
  quality: string | undefined,
): CommonQuality | null {
  switch (quality) {
    case "high":
      return CommonQuality.High;
    case "medium":
      return CommonQuality.Medium;
    case "low":
      return CommonQuality.Low;
    default:
      return null;
  }
}
