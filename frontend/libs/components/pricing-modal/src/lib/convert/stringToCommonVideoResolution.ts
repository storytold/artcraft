// CommonVideoResolution is the list of resolution values the desktop (Tauri) side understands (the image price request reuses it).
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
// Only caller: useImageCostEstimate (despite "Video" in the name). The legacy prompt stores hold lowercase "1k" | "2k" | "4k"
// (promptStore.ts), and the new-style picker holds "one_k" and its siblings. Returns the value for the price request, or null for no resolution.
export function stringToCommonVideoResolution(
  resolution: string | undefined,
): string | null {
  switch (resolution) {
    // Each group below lists every spelling of one resolution (new-style first, then legacy) and returns the one enum value for it.
    case "half_k":
      return CommonVideoResolution.HalfK;
    case "four_eighty_p":
    case "480p":
      return CommonVideoResolution.FourEightyP;
    case "seven_twenty_p":
    case "720p":
      return CommonVideoResolution.SevenTwentyP;
    case "one_k":
    case "1k":
      return CommonVideoResolution.OneK;
    case "ten_eighty_p":
    case "1080p":
      return CommonVideoResolution.TenEightyP;
    // The upper-case "2K" and "4K" spellings are accepted too, but none of the current prompt stores produces them;
    // there is no upper-case "1K" case. An unlisted spelling falls to the default branch and is sent on unchanged.
    case "two_k":
    case "2k":
    case "2K":
      return CommonVideoResolution.TwoK;
    case "three_k":
      return CommonVideoResolution.ThreeK;
    case "four_k":
    case "4k":
    case "4K":
      return CommonVideoResolution.FourK;
    default:
      // Unknown text is passed through unchanged; undefined becomes null.
      return resolution ?? null;
  }
}
