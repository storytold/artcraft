import type { SizeOption } from "../metadata/SizeOption.js";

export interface VideoAspectRatioCapabilities {
  readonly sizeOptions?: readonly SizeOption[];
  readonly defaultAspectRatio?: string;
}

/**
 * Resolve the UI label for a video model's aspect ratio.
 *
 * A still-valid user selection wins. Otherwise the server-declared canonical
 * default is matched through each option's Tauri value, with the first option
 * retained only as a compatibility fallback for catalogs without a usable
 * default.
 */
export function resolveVideoAspectRatioOption(
  model: VideoAspectRatioCapabilities | null | undefined,
  currentLabel: string | null | undefined,
): SizeOption | null {
  const options = model?.sizeOptions ?? [];
  if (options.length === 0) return null;

  const currentOption = options.find(
    (option) => option.textLabel === currentLabel,
  );
  if (currentOption) return currentOption;

  const defaultOption = options.find(
    (option) => option.tauriValue === model?.defaultAspectRatio,
  );
  return defaultOption ?? options[0]!;
}

export function resolveVideoAspectRatio(
  model: VideoAspectRatioCapabilities | null | undefined,
  currentLabel: string | null | undefined,
): string | null {
  return resolveVideoAspectRatioOption(model, currentLabel)?.textLabel ?? null;
}
