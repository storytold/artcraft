import {
  forwardRef,
  useCallback,
  useId,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { twMerge } from "tailwind-merge";

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
  /** Overrides the visual box styling (the rounded square). */
  checkboxClassName?: string;
  /** Overrides the label text styling. */
  labelClassName?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
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
      ...inputProps
    },
    ref,
  ) => {
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
          "inline-flex items-center gap-2 select-none leading-none",
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
            "relative inline-block shrink-0 rounded-[4px] border transition-colors",
            boxDims,
            isChecked
              ? "border-primary bg-primary text-white"
              : "border-ui-controls-border bg-ui-controls hover:border-primary/60",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40",
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
              "text-sm text-base-fg/70",
              disabled && "text-base-fg/40",
              labelClassName,
            )}
          >
            {label}
          </span>
        )}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
