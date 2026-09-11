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
        // PopoverMenu triggers); the 2px border is inside the box.
        "flex h-[34px] items-center justify-center rounded-lg border-2 border-transparent text-sm text-white backdrop-blur-lg transition-all",
        hasLabel ? "px-3" : "w-[34px]",
        isActive
          ? "border-white/20 bg-brand-primary/40 hover:border-white/30 hover:bg-brand-primary/40"
          : "bg-[#5F5F68]/60 hover:bg-[#5F5F68]/90",
        className
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
          <span className="text-sm font-medium text-white/90">{label}</span>
        )}
      </span>
    </Button>
  );
};
