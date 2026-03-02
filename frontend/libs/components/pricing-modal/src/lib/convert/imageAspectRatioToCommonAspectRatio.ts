import { CommonAspectRatio } from "@storyteller/api-enums";

// TODO(bt): This shouldn't exist. We need to standardize types throughout the frontend.

const VALID_COMMON_ASPECT_RATIOS = new Set<string>(
  Object.values(CommonAspectRatio),
);

/**
 * Convert an aspect ratio to a CommonAspectRatio for the image cost estimate API.
 *
 * Accepts either:
 * - A new-style CommonAspectRatio value (e.g. "wide_sixteen_by_nine") — used when the model
 *   supports the new aspect ratio picker and the value is stored/passed as a string.
 * - A legacy aspect ratio string ("wide" | "tall" | "square" | "auto") — used by the old
 *   prompt stores that predate the new CommonAspectRatio enum.
 */
export function imageAspectRatioToCommonAspectRatio(
  newStyleAspectRatio: string | undefined,
  legacyAspectRatio?: string,
): CommonAspectRatio | null {
  if (newStyleAspectRatio && VALID_COMMON_ASPECT_RATIOS.has(newStyleAspectRatio)) {
    return newStyleAspectRatio as CommonAspectRatio;
  }
  if (legacyAspectRatio) {
    switch (legacyAspectRatio) {
      case "wide":   return CommonAspectRatio.Wide;
      case "tall":   return CommonAspectRatio.Tall;
      case "square": return CommonAspectRatio.Square;
      case "auto":   return CommonAspectRatio.Auto;
    }
  }
  return null;
}
