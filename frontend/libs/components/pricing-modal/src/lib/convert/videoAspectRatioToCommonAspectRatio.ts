// SizeOption is one entry in a video model's list of size choices (a label shown to the user plus the value the desktop side wants).
import { SizeOption } from "@storyteller/model-list";

// TODO(bt): This shouldn't exist. We need to standardize types throughout the frontend.

// Looks up the aspect-ratio value for the size the user picked. Only caller: useVideoCostEstimate, which passes the picked label and the
// model's `sizeOptions`. The match is on the option's label text (the first option with that label wins), and the answer is that
// option's `tauriValue`. Returns null when there is no label, no list, or no option with that label (the request then omits the field).
export function videoAspectRatioToCommonAspectRatio(
  textLabel: string | null,
  sizeOptions: SizeOption[] | undefined,
): string | null {
  // Nothing picked, or the model has no size list: nothing to look up.
  if (!textLabel || !sizeOptions) return null;
  // Find the option whose label is exactly the picked text.
  const option = sizeOptions.find((o) => o.textLabel === textLabel);
  // The label is not in this model's list (for example left over from another model): no aspect ratio.
  if (!option) return null;
  // The desktop-side value for that size.
  return option.tauriValue;
}
