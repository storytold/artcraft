// Sticky prompt-box settings across model switches.
//
// The user's chosen value is kept in the store untouched when models change.
// At read time we resolve it against the *current* model's supported options:
// keep the choice if the model supports it, otherwise fall back to the model's
// default (for display + generation only) without overwriting the stored
// preference. That way returning to a model that supports the original value
// restores it, while a value both models share (e.g. 16:9) stays put.

// Resolve a preferred string option (aspect ratio, resolution, quality) against
// a model's supported list. Returns the preference when supported, else the
// model default when valid, else the first option. When the model exposes no
// options for this setting, the preference (or default) passes through unchanged.
export function resolveModelOption(
  preferred: string | undefined,
  options: readonly string[] | null | undefined,
  modelDefault: string | null | undefined,
): string | undefined {
  if (!options || options.length === 0) {
    return preferred ?? modelDefault ?? undefined;
  }
  if (preferred && options.includes(preferred)) return preferred;
  if (modelDefault && options.includes(modelDefault)) return modelDefault;
  return options[0];
}

// Resolve a preferred batch count against a model's options/limits. Clamps to
// [1, max], then snaps to the nearest supported option ≤ the preference (so a
// user who wanted 4 keeps the highest the model allows), falling back to the
// model default or smallest option.
export function resolveModelCount(
  preferred: number,
  options: readonly number[] | null | undefined,
  max: number | null | undefined,
  modelDefault: number | null | undefined,
): number {
  const cap = max ?? 4;
  const clamped = Math.min(Math.max(1, preferred), cap);
  if (!options || options.length === 0) return clamped;
  if (options.includes(clamped)) return clamped;

  const sorted = [...options].sort((a, b) => a - b);
  const atOrBelow = sorted.filter((o) => o <= clamped);
  if (atOrBelow.length) return atOrBelow[atOrBelow.length - 1];
  if (modelDefault != null && options.includes(modelDefault)) return modelDefault;
  return sorted[0];
}
