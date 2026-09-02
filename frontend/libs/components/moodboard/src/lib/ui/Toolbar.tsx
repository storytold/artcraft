import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { twMerge } from "tailwind-merge";

// Shared chrome for the moodboard's floating top bars. The Grid and Canvas
// toolbars render inside the same glass island with the same buttons and
// dividers, so the two views read as one surface — in line with the
// create-image/video promptbox language (`.glass` + 3px corners).

interface ToolbarShellProps {
  children: ReactNode;
  className?: string;
}

export const ToolbarShell = ({ children, className }: ToolbarShellProps) => (
  <div
    className={twMerge(
      "glass pointer-events-auto flex items-center gap-2 border border-ui-divider p-2 text-base-fg",
      className,
    )}
  >
    {children}
  </div>
);

export const ToolbarDivider = () => (
  <span className="h-7 w-px shrink-0 bg-ui-divider" aria-hidden />
);

// Exported: FloatingToolbarButton re-exports ToolbarIconButton, and
// declaration emit (TS4023) needs this props type to be nameable there.
export interface ToolbarIconButtonProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  tooltipDelay?: number;
}

export const ToolbarIconButton = ({
  icon,
  label,
  active,
  disabled,
  onClick,
  tooltipDelay = 300,
}: ToolbarIconButtonProps) => (
  <Tooltip content={label} position="bottom" delay={tooltipDelay} closeOnClick>
    <Button
      variant="ghost"
      icon={icon}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={twMerge(
        "h-9 w-9 rounded-[3px] border-transparent p-0 shadow-none",
        active
          ? "bg-primary/30 text-base-fg hover:bg-primary/40"
          : "bg-transparent text-base-fg/80 hover:bg-base-fg/10 hover:text-base-fg",
      )}
    />
  </Tooltip>
);
