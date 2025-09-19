import {
  FontAwesomeIcon,
  FontAwesomeIconProps,
} from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface ButtonIconProps extends FontAwesomeIconProps {
  icon: IconDefinition;
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
    "box-content flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150",
    bgFill
      ? "bg-ui-controls-button hover:bg-ui-controls-button/[0.75]"
      : "bg-transparent hover:bg-ui-panel/[0.4]",
    disabled && "opacity-50 hover:bg-transparent",
    propsClassName
  );

  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      <FontAwesomeIcon icon={icon} size={size} {...rest} />
    </button>
  );
};
