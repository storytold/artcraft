import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  isLow?: boolean;
}

export const Progress = ({
  value = 0,
  max = 100,
  isLow = false,
  className,
  ...props
}: ProgressProps) => {
  const percentage = Math.min(Math.max(0, value), max);

  return (
    <div
      className={twMerge(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <div
        className={twMerge(
          "h-full w-full flex-1 transition-all",
          isLow ? "bg-red/60" : "bg-primary"
        )}
        style={{ transform: `translateX(-${100 - percentage}%)` }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={percentage}
      />
    </div>
  );
};

export default Progress;
