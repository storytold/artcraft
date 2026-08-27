import type { LucideIcon } from "lucide-react";
import { DynamicIcon, DynamicIconProps } from "@storyteller/icons";
import { twMerge } from "tailwind-merge";

interface ButtonIconProps extends DynamicIconProps {
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
  bgFill?: boolean;
  disabled?: boolean;
}

export const ButtonIcon = ({
  icon,
  size,
  onClick,
  className: propsClassName,
  bgFill = false,
  disabled,
  ...rest
}: ButtonIconProps) => {
  const className = twMerge(
    "box-content flex h-8 w-8 items-center justify-center rounded-[3px] transition-colors duration-150",
    bgFill
      ? "bg-ui-controls-button hover:bg-ui-controls-button/[0.75]"
      : "bg-transparent hover:bg-ui-panel/[0.4]",
    disabled && "opacity-50 hover:bg-transparent",
    propsClassName,
  );

  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      <DynamicIcon icon={icon} size={size} {...rest} />
    </button>
  );
};
