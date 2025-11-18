import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "./button";
import { twMerge } from "tailwind-merge";

interface ToggleButtonProps {
  isActive: boolean;
  icon?: IconDefinition;
  activeIcon?: IconDefinition;
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
        "flex h-9 items-center justify-center rounded-lg border-2 border-transparent text-sm text-white backdrop-blur-lg transition-all",
        hasLabel ? "px-3" : "w-9",
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
          <FontAwesomeIcon
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
