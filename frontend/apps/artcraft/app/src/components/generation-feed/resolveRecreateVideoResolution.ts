const RESOLUTION_LABEL_BY_CANONICAL_VALUE: Readonly<Record<string, string>> = {
  four_eighty_p: "480p",
  seven_twenty_p: "720p",
  ten_eighty_p: "1080p",
};

/**
 * Resolve a prompt record's canonical resolution to the representation used
 * by the selected video model. Hydrated models expose canonical values, while
 * legacy overlays use 480p/720p/1080p for the three p-based enum variants.
 *
 * Exact canonical matches win. K-based values deliberately remain canonical:
 * display labels such as `1K` are presentation, not request values, and 1K
 * and 1080p are distinct resolutions.
 */
export function resolveRecreateVideoResolution(
  promptResolution: string | null | undefined,
  modelResolutionOptions: readonly string[] | null | undefined,
): string | null {
  if (!promptResolution || !modelResolutionOptions?.length) return null;

  const exactMatch = modelResolutionOptions.find(
    (option) => option === promptResolution,
  );
  if (exactMatch) return exactMatch;

  const expectedLabel = RESOLUTION_LABEL_BY_CANONICAL_VALUE[promptResolution];
  if (!expectedLabel) return null;

  return modelResolutionOptions.find((option) => option === expectedLabel) ??
    null;
}
