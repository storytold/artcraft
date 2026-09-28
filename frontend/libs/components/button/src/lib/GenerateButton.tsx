import { Button, ButtonProps } from "./button";
import { CoinsIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { Tooltip } from "@storyteller/ui-tooltip";

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
        "group flex items-center justify-center gap-2 h-[34px]",
        className,
      )}
      disabled={disabled}
      {...props}
    >
      <span className="truncate">{children}</span>

      {credits != null && (
        <Tooltip
          content={`${credits} credit${credits !== 1 ? "s" : ""} cost`}
          position="top"
          className="z-50"
        >
          <div
            className={twMerge(
              "flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity",
              disabled && "opacity-50",
            )}
          >
            <CoinsIcon className="text-xs" />
            <span className="text-[13px] font-bold">
              {credits}
            </span>
          </div>
        </Tooltip>
      )}
    </Button>
  );
};

export default GenerateButton;
