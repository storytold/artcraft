import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";

interface LoadingSpinnerProps {
  className?: string;
  thickness?: number;
}

export const LoadingSpinner = ({
  className,
}: LoadingSpinnerProps) => {
  return (
    <FontAwesomeIcon
      icon={faSpinnerThird}
      className={twMerge("h-6 w-6 animate-spin", className)}
    />
  );
};

export default LoadingSpinner;
