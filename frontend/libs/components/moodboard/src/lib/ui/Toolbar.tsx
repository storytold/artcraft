import { ReactNode } from "react";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { twMerge } from "tailwind-merge";

// Shared chrome for the moodboard's floating top bars. The Grid and Canvas
// toolbars render inside the same glass island with the same buttons and
// dividers, so the two views read as one surface — in line with the
// create-image/video promptbox language (`.glass` + rounded-2xl).

interface ToolbarShellProps {
  children: ReactNode;
  className?: string;
}

export const ToolbarShell = ({ children, className }: ToolbarShellProps) => (
  <div
    className={twMerge(
      "glass pointer-events-auto flex items-center gap-2 rounded-2xl border border-ui-divider p-2 text-base-fg shadow-[0_8px_28px_-12px_rgba(0,0,0,0.45)]",
      className,
    )}
  >
    {children}
  </div>
);

export const ToolbarDivider = () => (
  <span className="h-7 w-px shrink-0 bg-ui-divider" aria-hidden />
);

interface ToolbarIconButtonProps {
  icon: IconDefinition;
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
        "h-9 w-9 rounded-[10px] border-transparent p-0 shadow-none",
        active
          ? "bg-primary/30 text-base-fg hover:bg-primary/40"
          : "bg-transparent text-base-fg/80 hover:bg-base-fg/10 hover:text-base-fg",
      )}
    />
  </Tooltip>
);
