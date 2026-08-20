"use client";

import {
  useCallback,
  useId,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { twMerge } from "tailwind-merge";

/*
 * Ported from @storyteller/ui-checkbox: square box, hairline border, checked
 * state inverts to the theme's invert block (white-on-black in light,
 * black-on-white in dark).
 */

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden
    viewBox="0 0 10 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={twMerge("block", className)}
  >
    <path
      d="M1 4L3.6 6.6L9 1"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
>;

export interface CheckboxProps extends NativeInputProps {
  label?: ReactNode;
  size?: "sm" | "md";
  /** Overrides the visual box styling. */
  checkboxClassName?: string;
  /** Overrides the label text styling. */
  labelClassName?: string;
  ref?: Ref<HTMLInputElement>;
}

export function Checkbox({
  label,
  size = "md",
  className,
  checkboxClassName,
  labelClassName,
  id,
  disabled,
  checked,
  defaultChecked,
  onChange,
  ref,
  ...inputProps
}: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const isControlled = checked !== undefined;
  const [internal, setInternal] = useState(!!defaultChecked);
  const isChecked = isControlled ? checked : internal;

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setInternal(e.target.checked);
      onChange?.(e);
    },
    [isControlled, onChange],
  );

  const boxDims = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const iconDims = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";

  return (
    <label
      htmlFor={inputId}
      className={twMerge(
        "inline-flex select-none items-center gap-2 leading-none",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
    >
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        disabled={disabled}
        checked={isChecked}
        onChange={handleChange}
        {...inputProps}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={twMerge(
          "relative inline-block shrink-0 rounded-none border transition-colors",
          boxDims,
          isChecked
            ? "border-invert-bg bg-invert-bg text-invert-fg"
            : "border-line bg-transparent hover:border-line-strong",
          "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-ink",
          checkboxClassName,
        )}
      >
        {isChecked && (
          <CheckIcon
            className={twMerge(
              "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
              iconDims,
            )}
          />
        )}
      </span>
      {label != null && (
        <span
          className={twMerge(
            "text-sm text-muted",
            disabled && "text-faint",
            labelClassName,
          )}
        >
          {label}
        </span>
      )}
    </label>
  );
}

export default Checkbox;
