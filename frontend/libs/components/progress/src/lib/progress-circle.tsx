import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

interface ProgressCircleProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  isLow?: boolean;
  size?: "small" | "large";
  showPercentage?: boolean;
  reverse?: boolean;
}

export const ProgressCircle = ({
  value = 0,
  max = 100,
  isLow = false,
  size = "large",
  showPercentage = false,
  reverse = false,
  className,
  ...props
}: ProgressCircleProps) => {
  const percentage = Math.min(Math.max(0, value), max);
  const displayPercentage = percentage;

  // Make small circles actually smaller
  const radius = size === "small" ? 8 : 40;
  const strokeWidth = size === "small" ? 4 : 6;
  const circumference = 2 * Math.PI * radius;

  // Calculate stroke dashoffset differently based on direction
  const strokeDashoffset = reverse
    ? (percentage / 100) * circumference // Counter-clockwise
    : circumference - (percentage / 100) * circumference; // Clockwise

  const viewBoxSize = (radius + strokeWidth) * 2;

  return (
    <div
      className={twMerge(
        "relative inline-flex items-center justify-center",
        size === "small" ? "h-5 w-5" : "h-24 w-24",
        showPercentage && size === "small" ? "mr-6" : "", // Add margin for small with label
        className
      )}
      {...props}
    >
      {/* For small size, show percentage label outside to the right */}
      {showPercentage && size === "small" && (
        <div className="absolute -right-6 flex items-center justify-center">
          <span className="text-xs font-medium">
            {Math.round(displayPercentage)}%
          </span>
        </div>
      )}

      <svg
        className={`absolute h-full w-full ${
          reverse ? "rotate-90" : "-rotate-90"
        }`}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      >
        <circle
          className="stroke-white/20"
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
        />
        <circle
          className={twMerge(
            "transition-all",
            isLow ? "stroke-red/80" : "stroke-primary"
          )}
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={
            reverse
              ? `rotate(180, ${viewBoxSize / 2}, ${viewBoxSize / 2})`
              : undefined
          }
        />
      </svg>

      {/* For large size, show percentage in the center */}
      {showPercentage && size === "large" && (
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xl font-medium">
            {Math.round(displayPercentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressCircle;
