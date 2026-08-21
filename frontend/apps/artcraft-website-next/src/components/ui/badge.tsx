import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

// Ported from @storyteller/ui-badge: mono micro-label chip on a sunken
// hairline-bordered surface, theme-token colors for light/dark.
export interface BadgeProps {
  label: string;
  className?: string;
  icon?: ReactNode;
}

export function Badge({ label, className, icon }: BadgeProps) {
  return (
    <div
      className={twMerge(
        "flex w-fit items-center gap-1 rounded-none border border-line bg-bg-sunken px-1.5 py-px font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted",
        className,
      )}
    >
      {icon}
      {label}
    </div>
  );
}

export default Badge;
