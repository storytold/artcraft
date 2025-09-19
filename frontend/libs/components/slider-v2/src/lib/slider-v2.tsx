import { Transition } from "@headlessui/react";
import React, { useState, useRef, useEffect, ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { Button } from "@storyteller/ui-button";
import { faMinus, faPlus } from "@fortawesome/pro-solid-svg-icons";

interface SliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  step: number;
  className?: string;
  showTooltip?: boolean;
  tooltipContent?: ReactNode;
  suffix?: string;
  innerLabel?: string;
  showDecrement?: boolean;
  showIncrement?: boolean;
  variant?: "filled" | "classic";
  showProgressBar?: boolean;
}

export const SliderV2 = ({
  min,
  max,
  value,
  onChange,
  step,
  className,
  showTooltip,
  tooltipContent,
  suffix,
  innerLabel,
  showDecrement,
  showIncrement,
  variant = "filled",
  showProgressBar = true,
}: SliderProps) => {
  const [localValue, setLocalValue] = useState(value);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showHandleTooltip, setShowHandleTooltip] = useState(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const setClampedValue = (value: number) => {
    const roundedValue = Math.round(value / step) * step;
    const clampedValue = Math.min(Math.max(roundedValue, min), max);
    setLocalValue(clampedValue);
    onChange(clampedValue);
  };

  const updatePosition = (x: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const fraction = (x - rect.left) / rect.width;
    const newValue = fraction * (max - min) + min;
    setClampedValue(newValue);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setShowHandleTooltip(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    updatePosition(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    e.preventDefault();
    updatePosition(e.clientX);
  };

  const handleMouseUp = (e: MouseEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setShowHandleTooltip(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseEnter = () => {
    if (!isDragging) {
      setShowHandleTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isDragging) {
      setShowHandleTooltip(false);
    }
  };

  const handleDecrement = () => {
    setClampedValue(localValue - step);
  };

  const handleIncrement = () => {
    setClampedValue(localValue + step);
  };

  const percentage = ((localValue - min) / (max - min)) * 100;
  const displayValue =
    localValue.toFixed(step.toString().split(".")[1]?.length || 0) +
    (suffix || "");

  return (
    <div className="flex w-full">
      {showDecrement && (
        <Button
          icon={faMinus}
          className="focus-visible:outline-primary my-auto mr-1 size-6 rounded-full bg-transparent text-white/80 hover:bg-white/10 active:bg-brand-primary/30"
          onClick={handleDecrement}
        />
      )}

      {variant === "filled" ? (
        <div
          ref={sliderRef}
          className={twMerge(
            "glass border-ui-border group relative h-7 w-full cursor-pointer overflow-hidden rounded-lg border",
            isDragging && "!bg-ui-controls/90",
            className
          )}
          onMouseDown={handleMouseDown}
        >
          <div
            className={twMerge(
              "absolute h-full bg-brand-primary/30 transition-colors duration-300 group-hover:bg-brand-primary/50",
              isDragging && "!bg-brand-primary/50"
            )}
            style={{ width: `${percentage}%` }}
          >
            {innerLabel && (
              <span
                className={twMerge(
                  "absolute top-1/2 ml-2.5 -translate-y-1/2 text-nowrap text-sm font-medium text-white/60 transition-colors duration-300 group-hover:text-white",
                  isDragging && "!text-white"
                )}
              >
                {innerLabel}
              </span>
            )}
            <div
              className={twMerge(
                "absolute right-0 top-1/2 mr-1 h-4 w-0.5 -translate-y-1/2 rounded-full",
                isDragging ? "bg-white" : "bg-white/50"
              )}
              onMouseDown={handleMouseDown}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            />
          </div>
        </div>
      ) : (
        <div
          ref={sliderRef}
          className={twMerge(
            "relative h-4 w-full cursor-pointer flex items-center",
            className
          )}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute left-0 right-0 h-2 bg-ui-border rounded-full bg-white/15" />
          {showProgressBar && (
            <div
              className="absolute left-0 h-2 bg-white rounded-full transition-all duration-200"
              style={{ width: `${percentage}%` }}
            />
          )}
          <div
            className={twMerge(
              "absolute top-1/2 z-10 size-4 -translate-y-1/2 rounded-full border-2 border-white bg-white shadow transition-colors duration-200 hover:ring-[4px] hover:ring-white/20",
              isDragging ? "ring-[4px] ring-white/20" : ""
            )}
            style={{ left: `calc(${percentage}% - 10px)` }}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        </div>
      )}

      {showIncrement && (
        <Button
          icon={faPlus}
          className="focus-visible:outline-primary my-auto ml-1 size-6 rounded-full bg-transparent text-white/80 hover:bg-white/10 active:bg-brand-primary/30"
          onClick={handleIncrement}
        />
      )}

      {showTooltip && (
        <Transition
          as={"div"}
          show={showHandleTooltip}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0"
        >
          <div
            className="absolute -top-8 z-10 rounded-md bg-ui-panel px-2 py-1 text-xs text-black shadow-lg"
            style={{ left: `${percentage}%`, transform: "translateX(-50%)" }}
          >
            {tooltipContent ? tooltipContent : displayValue}
          </div>
        </Transition>
      )}
    </div>
  );
};
