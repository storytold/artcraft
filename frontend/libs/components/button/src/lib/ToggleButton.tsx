import type { LucideIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { Button } from "./button";
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
        // 34px matches the sibling toolbar controls (GenerateButton, the
        // PopoverMenu triggers). Flat control surface + hairline border,
        // same idiom as the PopoverMenu triggers beside it — the old glassy
        // backdrop-blur look predates the brutalist system.
        "flex h-[34px] items-center justify-center rounded-[3px] border border-ui-controls-border bg-ui-controls text-sm text-white transition-colors",
        hasLabel ? "px-3" : "w-[34px]",
        isActive
          ? "border-white/30 bg-brand-primary/40 hover:bg-brand-primary/50"
          : "hover:border-white/30 hover:bg-white/10",
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
          <span className="text-xs font-medium text-white/90">{label}</span>
        )}
      </span>
    </Button>
  );
};
