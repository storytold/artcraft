import { Transition } from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";

interface LoadingBarProps {
  id?: string;
  wrapperClassName?: string;
  innerWrapperClassName?: string;
  progressBackgroundClassName?: string;
  progressClassName?: string;
  variant?: string;
  show?: boolean;
  hasSpinner?: boolean;
  progressData: {
    progress: number;
    label?: string;
    message?: string;
  };
}
export const LoadingBar = ({
  wrapperClassName: propsWrapperClassName,
  innerWrapperClassName: propsInnerWrapperClassName,
  progressBackgroundClassName: propsProgressBackgroundClassName,
  progressClassName: propsProgressClassName,
  progressData,
  hasSpinner,
  variant = "primary",
  show = true,
  ...rest
}: LoadingBarProps) => {
  function getVariantClassNames(variant: string) {
    switch (variant) {
      case "secondary": {
        return " bg-brand-secondary text-white ";
      }
      case "primary":
      default: {
        return " bg-brand-primary text-white ";
      }
    }
  }

  const wrapperClassName = twMerge(
    "w-full h-full relative bg-ui-background",
    propsWrapperClassName,
  );
  const innerWrapperClassName = twMerge(
    "w-full h-full p-4 gap-6 m-auto flex flex-col justify-center items-center",
    propsInnerWrapperClassName,
  );
  const progressBackgroundClassName = twMerge(
    "w-full bg-brand-secondary-800 rounded-full h-2.5",
    propsProgressBackgroundClassName,
  );
  const progressClassName = twMerge(
    "h-2.5 rounded-full transition-all duration-1000",
    getVariantClassNames(variant),
    propsProgressClassName,
  );

  return (
    <Transition
      as="div"
      className={wrapperClassName}
      show={show}
      enter="transition-opacity duration-150"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-1000"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      {...rest}
    >
      <div className={innerWrapperClassName}>
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2.5">
            {hasSpinner && <LoadingSpinner className="h-5" />}
            {progressData.label && (
              <label className="text-lg font-medium">
                {progressData.label}
              </label>
            )}
          </div>
        </div>

        <div className={progressBackgroundClassName}>
          <div
            className={progressClassName}
            style={{ width: progressData.progress + "%" }}
          />
        </div>

        {progressData.message && (
          <p className="text-center text-sm opacity-75">
            {progressData.message}
          </p>
        )}
      </div>
    </Transition>
  );
};
