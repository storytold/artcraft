import { SizeOption } from "@storyteller/model-list";

// TODO(bt): This shouldn't exist. We need to standardize types throughout the frontend.

export function videoAspectRatioToCommonAspectRatio(
  textLabel: string | null,
  sizeOptions: SizeOption[] | undefined,
): string | null {
  if (!textLabel || !sizeOptions) return null;
  const option = sizeOptions.find((o) => o.textLabel === textLabel);
  if (!option) return null;
  return option.tauriValue;
}
