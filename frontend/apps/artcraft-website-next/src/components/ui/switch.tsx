"use client";

import { twMerge } from "tailwind-merge";

/*
 * Ported from @storyteller/ui-switch, rebuilt on a native button (no
 * headlessui). Square track and knob; on-state inverts to the theme's
 * invert block.
 */
export interface SwitchProps {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  disabled?: boolean;
  className?: string;
  offClassName?: string;
  "aria-label"?: string;
}

export function Switch({
  enabled,
  setEnabled,
  disabled,
  className,
  offClassName,
  "aria-label": ariaLabel,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => setEnabled(!enabled)}
      className={twMerge(
        "inline-flex h-6 w-11 items-center rounded-none border transition-colors",
        enabled
          ? "border-invert-bg bg-invert-bg"
          : (offClassName ?? "border-line bg-transparent hover:border-line-strong"),
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span
        className={twMerge(
          "size-4 rounded-none transition-transform",
          enabled ? "translate-x-[22px] bg-invert-fg" : "translate-x-1 bg-ink/70",
        )}
      />
    </button>
  );
}

export default Switch;
