import { CommonAspectRatio } from "@storyteller/api-enums";
import { SizeOption } from "@storyteller/model-list";

// TODO(bt): This shouldn't exist. We need to standardize types throughout the frontend.

const VALID_COMMON_ASPECT_RATIOS = new Set<string>(
  Object.values(CommonAspectRatio),
);

export function videoAspectRatioToCommonAspectRatio(
  textLabel: string | null,
  sizeOptions: SizeOption[] | undefined,
): CommonAspectRatio | null {
  if (!textLabel || !sizeOptions) return null;
  const option = sizeOptions.find((o) => o.textLabel === textLabel);
  if (!option) return null;
  const { tauriValue } = option;
  if (VALID_COMMON_ASPECT_RATIOS.has(tauriValue)) {
    return tauriValue as CommonAspectRatio;
  }
  return null;
}
