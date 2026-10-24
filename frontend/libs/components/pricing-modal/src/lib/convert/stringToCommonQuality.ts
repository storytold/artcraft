// CommonQuality is the list of quality tiers the desktop (Tauri) side understands.
import { CommonQuality } from "@storyteller/api-enums";

/**
 * Convert a quality value to CommonQuality for the image cost estimate API.
 *
 * Preserves all API quality tiers, including values added after this build.
 */
// Only caller: useImageCostEstimate, with the model's own resolved quality text (or undefined for models without a quality choice).
// Returns the value to put in the price request, or null when there is no quality (the request then leaves the field out).
export function stringToCommonQuality(
  quality: string | undefined,
): string | null {
  switch (quality) {
    // The six tiers known to this build map to their enum values.
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
      // Any other text is passed through unchanged (that is the "values added after this build" promise above); undefined becomes null.
      return quality ?? null;
  }
}
