import { ReactNode } from "react";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { twMerge } from "tailwind-merge";

interface FloatingToolbarProps {
  children: ReactNode;
  className?: string;
}

export const FloatingToolbar = ({
  children,
  className,
}: FloatingToolbarProps) => (
  <div className="pointer-events-none flex w-full justify-center pt-3">
    <div
      className={twMerge(
        "glass pointer-events-auto rounded-xl p-1.5 text-base-fg shadow-md",
        className,
      )}
    >
      <div className="flex items-center justify-center gap-2">{children}</div>
    </div>
  </div>
);

export const FloatingToolbarDivider = () => (
  <span className="px-1 text-base text-base-fg/20" aria-hidden>
    |
  </span>
);

interface FloatingToolbarButtonProps {
  icon: IconDefinition;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  tooltipDelay?: number;
}

export const FloatingToolbarButton = ({
  icon,
  label,
  active,
  disabled,
  onClick,
  tooltipDelay = 300,
}: FloatingToolbarButtonProps) => (
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
