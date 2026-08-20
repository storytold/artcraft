import { XIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

// Ported from @storyteller/ui-close-button: square icon button that inverts
// on hover.
export interface CloseButtonProps {
  onClick: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function CloseButton({
  onClick,
  className,
  size = "md",
}: CloseButtonProps) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-7 w-7",
    lg: "h-9 w-9",
  };

  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClick}
      className={twMerge(
        "flex items-center justify-center rounded-none text-muted transition-colors hover:bg-invert-bg hover:text-invert-fg",
        sizeClasses[size],
        className,
      )}
    >
      <XIcon className="h-[70%] w-[70%]" />
    </button>
  );
}

export default CloseButton;
