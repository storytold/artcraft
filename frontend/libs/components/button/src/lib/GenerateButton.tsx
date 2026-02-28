import { Button, ButtonProps } from "./button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoins } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";

interface GenerateButtonProps extends ButtonProps {
  credits?: number | null;
}

export const GenerateButton = ({
  credits,
  children,
  className,
  disabled,
  ...props
}: GenerateButtonProps) => {
  return (
    <Button
      className={twMerge(
        "group flex items-center justify-center gap-2 pl-3 pr-2",
        className,
      )}
      disabled={disabled}
      {...props}
    >
      <span className="truncate">{children}</span>

      {credits != null && (
        <div
          className={twMerge(
            "flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none",
            disabled && "opacity-50",
          )}
          title={`${credits} credit${credits !== 1 ? "s" : ""} cost`}
        >
          <FontAwesomeIcon icon={faCoins} className="text-xs text-white" />
          <span className="text-[13px] font-bold text-white/90">{credits}</span>
        </div>
      )}
    </Button>
  );
};

export default GenerateButton;
