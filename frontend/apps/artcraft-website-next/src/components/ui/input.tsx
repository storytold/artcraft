import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { twMerge } from "tailwind-merge";
import { Label } from "./label";

/*
 * Ported from @storyteller/ui-input: squared text field on a raised surface
 * with hairline border that sharpens on hover and goes full-ink on focus.
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputClassName?: string;
  label?: string;
  /** Rendered inside the field's left edge (sized by the caller). */
  icon?: ReactNode;
  isError?: boolean;
  errorMessage?: string;
  ref?: Ref<HTMLInputElement>;
}

export function Input({
  label,
  icon,
  inputClassName,
  className,
  id,
  isError,
  errorMessage,
  ref,
  ...rest
}: InputProps) {
  const inputId = id ?? label;
  return (
    <div className={twMerge("flex flex-col", className)}>
      {label && <Label htmlFor={inputId}>{label}</Label>}

      <div className="relative w-full">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={twMerge(
            "h-10 w-full rounded-none border border-line bg-bg-raised px-3 py-2.5 text-ink outline-none placeholder:text-faint",
            "transition-colors duration-150 ease-in-out hover:border-line-strong focus:border-ink focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-line",
            icon && "pl-10",
            isError && "border-danger focus:border-danger",
            inputClassName,
          )}
          {...rest}
        />
        {errorMessage && (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-danger">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}

export default Input;
