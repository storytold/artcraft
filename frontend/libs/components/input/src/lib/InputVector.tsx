import React, { ChangeEvent, RefObject, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { DomLevels } from "@storyteller/common";

interface InputVectorProps {
  x: string;
  y: string;
  z: string;
  onChange: (v: Record<string, string>) => void;
  increment?: number;
  disabled?: boolean;
  disableHotkeyInput: (level: DomLevels) => void;
  enableHotkeyInput: (level: DomLevels) => void;
}

export const InputVector = ({
  x,
  y,
  z,
  onChange,
  increment = 0.1,
  disabled,
  disableHotkeyInput,
  enableHotkeyInput,
}: InputVectorProps) => {
  const xRef = useRef<HTMLInputElement>(null);
  const yRef = useRef<HTMLInputElement>(null);
  const zRef = useRef<HTMLInputElement>(null);

  const isDragging = useRef(false);
  const previousMousePosition = useRef(0);

  const oldX = useRef("");
  const oldY = useRef("");
  const oldZ = useRef("");

  oldX.current = x;
  oldY.current = y;
  oldZ.current = z;

  const inputCommonClasses =
    "relative h-6 rounded-r-lg bg-black/25 p-2 text-sm text-white transition-all duration-100 ease-in-out outline-none -outline-offset-2 text-end w-full hover:cursor-e-resize hover:bg-black/40";

  const wrapperCommonClasses =
    "relative flex items-center before:inline-block before:h-6 before:bg-brand-primary before:text-white before:rounded-l-lg before:w-1.5 before:text-center before:justify-center before:items-center before:font-semibold before:flex before:align-middle before:leading-8 text-xs";

  const lockedCommonClasses =
    "hover:cursor-not-allowed hover:bg-brand-secondary";

  function validateInput(newValue: string, oldValue: string) {
    if (newValue === "" || newValue === "-" || newValue === ".") {
      return newValue;
    }
    return /^-?\d*(\.\d{0,2})?$/.test(newValue) ? newValue : oldValue;
  }

  function handleOnChange(event: ChangeEvent<HTMLInputElement>) {
    const newVector: Record<string, string> = {
      x: oldX.current,
      y: oldY.current,
      z: oldZ.current,
    };

    newVector[event.target.name] = validateInput(
      event.target.value,
      newVector[event.target.name],
    );

    onChange(newVector);
  }

  const blurAllInputs = () => {
    xRef.current?.blur();
    yRef.current?.blur();
    zRef.current?.blur();
  };

  // For dragging the input value to increment/decrement
  const handleMouseDown = (
    e: React.MouseEvent,
    ref: RefObject<HTMLInputElement|null>,
  ) => {
    e.stopPropagation();
    blurAllInputs();
    previousMousePosition.current = e.clientX;
    isDragging.current = true;

    const mouseMoveHandler = (e: MouseEvent) => {
      e.stopPropagation();
      const currentMousePosition = e.clientX;
      const direction =
        currentMousePosition === previousMousePosition.current
          ? 0
          : currentMousePosition > previousMousePosition.current
            ? 1
            : -1;

      previousMousePosition.current = currentMousePosition;

      const newVector = {
        x: oldX.current,
        y: oldY.current,
        z: oldZ.current,
      } as Record<string, string>;

      const newValue =
        parseFloat(newVector[ref.current?.name ?? ""]) + direction * increment;

      newVector[ref.current?.name ?? ""] = (
        Math.round(newValue * 1000) / 1000
      ).toString();

      onChange(newVector);
    };

    const mouseUpHandler = () => {
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
      isDragging.current = false;
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.currentTarget as HTMLInputElement).blur(); // Unfocus the input field on pressing Enter
    }
  };

  return (
    <div className="flex w-full flex-col justify-between gap-1.5">
      <span
        className={twMerge(
          wrapperCommonClasses,
          "before:bg-axis-x",
          disabled && "opacity-60",
        )}
      >
        <div className="absolute left-3.5 z-10 font-semibold">X</div>
        <input
          className={twMerge(
            inputCommonClasses,
            "focus:outline-axis-x",
            disabled && lockedCommonClasses,
          )}
          type="text"
          name="x"
          onChange={handleOnChange}
          ref={xRef}
          value={x}
          disabled={disabled}
          onFocus={() => {
            disableHotkeyInput(DomLevels.INPUT);
          }}
          onBlur={() => {
            enableHotkeyInput(DomLevels.INPUT);
          }}
          onMouseDown={(e) => {
            handleMouseDown(e, xRef);
          }}
          onKeyDown={handleKeyDown}
        />
      </span>
      <span
        className={twMerge(
          wrapperCommonClasses,
          "before:bg-axis-y",
          disabled && "opacity-60",
        )}
      >
        <div className="absolute left-3.5 z-10 font-semibold">Y</div>
        <input
          className={twMerge(
            inputCommonClasses,
            "focus:outline-axis-y",
            disabled && lockedCommonClasses,
          )}
          type="text"
          name="y"
          onChange={handleOnChange}
          ref={yRef}
          value={y}
          disabled={disabled}
          onFocus={() => {
            disableHotkeyInput(DomLevels.INPUT);
          }}
          onBlur={() => {
            enableHotkeyInput(DomLevels.INPUT);
          }}
          onMouseDown={(e) => {
            handleMouseDown(e, yRef);
          }}
          onKeyDown={handleKeyDown}
        />
      </span>
      <span
        className={twMerge(
          wrapperCommonClasses,
          "before:bg-axis-z",
          disabled && "opacity-60",
        )}
      >
        <div className="absolute left-3.5 z-10 font-semibold">Z</div>
        <input
          className={twMerge(
            inputCommonClasses,
            "focus:outline-axis-z",
            disabled && lockedCommonClasses,
          )}
          type="text"
          name="z"
          onChange={handleOnChange}
          ref={zRef}
          value={z}
          disabled={disabled}
          onFocus={() => {
            disableHotkeyInput(DomLevels.INPUT);
          }}
          onBlur={() => {
            enableHotkeyInput(DomLevels.INPUT);
          }}
          onMouseDown={(e) => {
            handleMouseDown(e, zRef);
          }}
          onKeyDown={handleKeyDown}
        />
      </span>
    </div>
  );
};
