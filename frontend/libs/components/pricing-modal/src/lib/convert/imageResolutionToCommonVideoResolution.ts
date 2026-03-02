import { CommonVideoResolution } from "@storyteller/api-enums";

// TODO(bt): This shouldn't exist. We need to standardize types throughout the frontend.

/**
 * Convert a resolution value to CommonVideoResolution for the image cost estimate API.
 * The image cost API reuses CommonVideoResolution since the values (1k/2k/4k) are the same.
 *
 * Accepts either:
 * - A new-style CommonResolution value from @storyteller/model-list ("one_k", "two_k", "four_k")
 * - A legacy resolution string ("1k", "2k", "4k") from the old prompt stores
 */
export function imageResolutionToCommonVideoResolution(
  resolution: string | undefined,
): CommonVideoResolution | null {
  switch (resolution) {
    case "one_k":
    case "1k":
      return CommonVideoResolution.OneK;
    case "two_k":
    case "2k":
      return CommonVideoResolution.TwoK;
    case "four_k":
    case "4k":
      return CommonVideoResolution.FourK;
    default:
      return null;
  }
}
