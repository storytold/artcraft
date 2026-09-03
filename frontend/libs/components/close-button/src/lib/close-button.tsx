import { XIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface CloseButtonProps {
  onClick: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const CloseButton = ({
  onClick,
  className,
  size = "md",
}: CloseButtonProps) => {
  const sizeClasses = {
    sm: "h-5 w-5 text-sm",
    md: "h-7 w-7 text-md",
    lg: "h-9 w-9 text-xl",
  };

  return (
    <button
      onClick={onClick}
      className={twMerge(
        "flex items-center justify-center rounded-[3px] bg-white/10 text-white/70 transition-colors hover:bg-white hover:text-black",
        sizeClasses[size],
        className,
      )}
    >
      <XIcon />
    </button>
  );
};

export default CloseButton;
