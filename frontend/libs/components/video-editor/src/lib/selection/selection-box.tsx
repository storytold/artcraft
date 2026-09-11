"use client";

import type { SelectionBoxBounds } from "./types";

interface SelectionBoxProps {
  bounds: SelectionBoxBounds | null;
}

export function SelectionBox({ bounds }: SelectionBoxProps) {
  if (!bounds) return null;

  return (
    <div
      style={{
        left: `${bounds.left}px`,
        top: `${bounds.top}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
      }}
      className="border-foreground/50 bg-foreground/5 pointer-events-none absolute z-50 border"
    />
  );
}
