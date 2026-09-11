import { LoaderCircleIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface LoadingSpinnerProps {
  className?: string;
  thickness?: number;
}

export const LoadingSpinner = ({
  className,
}: LoadingSpinnerProps) => {
  return (
    <LoaderCircleIcon
      
      className={twMerge("h-6 w-6 animate-spin", className)} />
  );
};

export default LoadingSpinner;
