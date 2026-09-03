import React from "react";
import { twMerge } from "tailwind-merge";
import type { LucideIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { Label } from "@storyteller/ui-label";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputClassName?: string;
  iconClassName?: string;
  label?: string;
  icon?: LucideIcon;
  isError?: boolean;
  errorMessage?: string;
}

export const Input = React.forwardRef(
  (
    {
      label,
      icon,
      inputClassName,
      iconClassName,
      className,
      id,
      isError,
      onBlur,
      onFocus,
      errorMessage,
      ...rest
    }: InputProps,
    ref: React.ForwardedRef<HTMLInputElement>,
  ) => {
    return (
      <div className={twMerge("flex flex-col", className)}>
        {label && <Label htmlFor={id ? id : label}>{label}</Label>}

        <div className="relative w-full">
          {icon && (
            <DynamicIcon
              icon={icon}
              className={twMerge(
                "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
                iconClassName,
              )}
            />
          )}
          <input
            ref={ref}
            id={id ? id : label ? label : undefined}
            className={twMerge(
              "h-10 w-full rounded-[3px] px-3 py-2.5 outline-none",
              "bg-ui-panel text-base-fg placeholder-base-fg/40",
              "border border-ui-panel-border transition-colors duration-150 ease-in-out hover:border-white/40 focus:border-white focus:!outline-none",
              "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-ui-panel-border",
              icon && "pl-10",
              isError && "border-red-500 focus:border-red-500",
              inputClassName,
            )}
            onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
              if (onFocus) {
                onFocus(e);
              }
            }}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
              if (onBlur) {
                onBlur(e);
              }
            }}
            {...rest}
          />
          {errorMessage && (
            <h6 className="absolute z-10 text-red-400">{errorMessage}</h6>
          )}
        </div>
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
