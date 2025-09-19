import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Button } from "./button";
import { twMerge } from "tailwind-merge";

interface ToggleButtonProps {
  isActive: boolean;
  icon?: IconDefinition;
  activeIcon?: IconDefinition;
  onClick: () => void;
  className?: string;
}

export const ToggleButton = ({
  isActive,
  icon,
  activeIcon,
  onClick,
  className,
}: ToggleButtonProps) => {
  return (
    <Button
      className={twMerge(
        "flex h-9 w-9 items-center border-2 border-transparent text-sm text-white backdrop-blur-lg transition-all",
        isActive
          ? "border-white/20 bg-brand-primary/40 hover:border-white/30 hover:bg-brand-primary/40"
          : "bg-[#5F5F68]/60 hover:bg-[#5F5F68]/90",
        className
      )}
      variant="secondary"
      icon={isActive && activeIcon ? activeIcon : icon}
      onClick={onClick}
    />
  );
};
