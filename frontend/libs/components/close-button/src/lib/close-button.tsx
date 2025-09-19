import { faXmark } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
        "flex items-center justify-center rounded-full bg-black/40 text-white/60 transition-all hover:bg-black/70 hover:text-white",
        sizeClasses[size],
        className
      )}
    >
      <FontAwesomeIcon icon={faXmark} />
    </button>
  );
};

export default CloseButton;
