import type { OmniGenVideoModelInfo } from "@storyteller/api";
import type { PopoverItem } from "@storyteller/ui-popover";
import {
  AspectRatioIcon,
  AutoIcon,
} from "../create-image/components/AspectRatioIcon";

// Shared option-building helpers for video promptboxes. Used by the
// create-video page and by model landing pages (e.g. /minimax-h3) that render
// a promptbox locked to a single model.

export const AUTO_RATIOS = new Set(["auto", "auto_2k", "auto_3k", "auto_4k"]);

// ── Aspect ratio labels (shared with image page) ─────────────────────────

export const AR_LABELS: Record<string, string> = {
  auto: "Auto",
  square: "Square",
  wide_five_by_four: "5:4 (Wide)",
  wide_four_by_three: "4:3 (Wide)",
  wide_three_by_two: "3:2 (Wide)",
  wide_sixteen_by_nine: "16:9 (Wide)",
  wide_twenty_one_by_nine: "21:9 (Wide)",
  tall_four_by_five: "4:5 (Tall)",
  tall_three_by_four: "3:4 (Tall)",
  tall_two_by_three: "2:3 (Tall)",
  tall_nine_by_sixteen: "9:16 (Tall)",
  tall_nine_by_twenty_one: "9:21 (Tall)",
  auto_2k: "Auto (2K)",
  auto_3k: "Auto (3K)",
  auto_4k: "Auto (4K)",
  square_hd: "Square (HD)",
  wide: "Wide",
  tall: "Tall",
};

export const RES_LABELS: Record<string, string> = {
  half_k: "0.5K",
  four_eighty_p: "480p",
  seven_twenty_p: "720p",
  one_k: "1K",
  ten_eighty_p: "1080p",
  two_k: "2K",
  three_k: "3K",
  four_k: "4K",
};

export const LABEL_TO_RES: Record<string, string> = Object.fromEntries(
  Object.entries(RES_LABELS).map(([k, v]) => [v, k]),
);

export function buildSizePopoverItems(
  aspectRatioOptions: string[],
  selectedValue: string,
): PopoverItem[] {
  return aspectRatioOptions.map((ar) => ({
    label: AR_LABELS[ar] ?? ar,
    selected: ar === selectedValue,
    icon: AUTO_RATIOS.has(ar) ? (
      <AutoIcon />
    ) : (
      <AspectRatioIcon commonAspectRatio={ar} />
    ),
    action: ar,
  }));
}

export function buildResolutionPopoverItems(
  resolutionOptions: string[],
  selectedValue: string | null,
): PopoverItem[] {
  return resolutionOptions.map((r) => ({
    label: RES_LABELS[r] ?? r,
    selected: r === selectedValue,
  }));
}

export function resolveDurationForModel(
  model: OmniGenVideoModelInfo,
  current: number | null,
): number | null {
  if (current == null) return model.duration_seconds_default ?? null;
  if (
    model.duration_seconds_min != null &&
    model.duration_seconds_max != null
  ) {
    if (
      current >= model.duration_seconds_min &&
      current <= model.duration_seconds_max
    ) {
      return current;
    }
    return model.duration_seconds_default ?? model.duration_seconds_min;
  }
  if (model.duration_seconds_options?.length) {
    if (model.duration_seconds_options.includes(current)) return current;
    return model.duration_seconds_default ?? model.duration_seconds_options[0]!;
  }
  return model.duration_seconds_default ?? null;
}

// The slider range for a model's duration control, or null when the model has
// a single fixed duration (no control shown).
export function getDurationRange(
  model: OmniGenVideoModelInfo,
): { min: number; max: number } | null {
  if (
    model.duration_seconds_min != null &&
    model.duration_seconds_max != null &&
    model.duration_seconds_max > model.duration_seconds_min
  ) {
    return {
      min: model.duration_seconds_min,
      max: model.duration_seconds_max,
    };
  }
  if (
    model.duration_seconds_options &&
    model.duration_seconds_options.length > 1
  ) {
    const opts = [...model.duration_seconds_options].sort((a, b) => a - b);
    return { min: opts[0]!, max: opts[opts.length - 1]! };
  }
  return null;
}
