// CommonAspectRatio is the list of aspect-ratio values the desktop (Tauri) side understands; the legacy names below are mapped onto it.
import { CommonAspectRatio } from "@storyteller/api-enums";

// TODO(bt): This shouldn't exist. We need to standardize types throughout the frontend.

/**
 * Convert an aspect ratio to a CommonAspectRatio for the image cost estimate API.
 *
 * Accepts either:
 * - A new-style CommonAspectRatio value (e.g. "wide_sixteen_by_nine") — used when the model
 *   supports the new aspect ratio picker and the value is stored/passed as a string.
 * - A legacy aspect ratio string ("wide" | "tall" | "square" | "auto") — used by the old
 *   prompt stores that predate the new CommonAspectRatio enum.
 */
// Only caller: useImageCostEstimate (Text to Image passes the new-style value; Canvas 2D and Image Editor pass the legacy one).
// Returns the value to put in the price request, or null when neither argument gives one (the request then leaves the field out).
export function imageAspectRatioToCommonAspectRatio(
  newStyleAspectRatio: string | undefined,
  legacyAspectRatio?: string,
): string | null {
  // A new-style value wins when present. It is passed through as it is (cast, not checked against the enum), because the page already
  // took it from a list of valid choices.
  if (newStyleAspectRatio) {
    return newStyleAspectRatio as CommonAspectRatio;
  }
  // No new-style value: try the legacy name.
  if (legacyAspectRatio) {
    switch (legacyAspectRatio) {
      // The four legacy names each map to the matching enum value. Any other legacy text matches none of these and falls out of the switch.
      case "wide":   return CommonAspectRatio.Wide;
      case "tall":   return CommonAspectRatio.Tall;
      case "square": return CommonAspectRatio.Square;
      case "auto":   return CommonAspectRatio.Auto;
    }
  }
  // Nothing usable (both empty, or an unknown legacy name): no aspect ratio in the request.
  return null;
}
