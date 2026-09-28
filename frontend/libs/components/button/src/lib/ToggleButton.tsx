import type { LucideIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { Button, NEUTRAL_BUTTON_HOVER_CLASSES } from "./button";
import { twMerge } from "tailwind-merge";

interface ToggleButtonProps {
  isActive: boolean;
  icon?: LucideIcon;
  activeIcon?: LucideIcon;
  label?: string;
  onClick: () => void;
  className?: string;
}

export const ToggleButton = ({
  isActive,
  icon,
  activeIcon,
  label,
  onClick,
  className,
}: ToggleButtonProps) => {
  const displayIcon = isActive && activeIcon ? activeIcon : icon;
  const hasLabel = Boolean(label);

  return (
    <Button
      className={twMerge(
        // Same box and type as the PopoverMenu triggers beside it (34px,
        // text-sm sans, flat control surface + hairline border), overriding
        // the Button base's mono uppercase label.
        "flex h-[34px] items-center justify-center rounded-[3px] border border-ui-controls-border bg-ui-controls py-0 font-sans text-sm font-medium normal-case tracking-normal text-base-fg transition-colors",
        hasLabel ? "px-3" : "w-[34px] p-0",
        isActive
          ? "border-white/40 bg-white/10 hover:border-white/40 hover:bg-white/15"
          : NEUTRAL_BUTTON_HOVER_CLASSES,
        className,
      )}
      variant="secondary"
      onClick={onClick}
    >
      <span className="flex items-center gap-2">
        {displayIcon && (
          <DynamicIcon
            icon={displayIcon}
            className={twMerge("text-base", hasLabel && "text-sm")}
          />
        )}
        {label && (
          <span className="whitespace-nowrap">{label}</span>
        )}
      </span>
    </Button>
  );
};
