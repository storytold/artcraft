"use client";

// TODO(parallel-port): the original FontPicker (opencut-classic
// apps/web/src/components/ui/font-picker.tsx) depends on the fonts subsystem
// (useFontAtlas / SYSTEM_FONTS / loadFullFont) which has not been ported into
// this lib yet. Until that lands, we expose a minimal text-input fallback
// matching the same `defaultValue` / `onValueChange` signature so consumers
// (e.g. masks/text-mask params) can compile without dragging in the fonts
// subsystem.

import { cn } from "../../utils/ui";

interface FontPickerProps {
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function FontPicker({
  defaultValue,
  onValueChange,
  className,
}: FontPickerProps) {
  return (
    <input
      className={cn(
        "border-input bg-accent h-9 w-full rounded-md border px-3 text-sm outline-none",
        className,
      )}
      defaultValue={defaultValue}
      onChange={(event) => onValueChange?.(event.currentTarget.value)}
    />
  );
}
