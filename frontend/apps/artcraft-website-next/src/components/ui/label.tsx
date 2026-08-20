import type { LabelHTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

// Ported from @storyteller/ui-label: mono uppercase field label.
export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  required?: boolean;
}

export function Label({ className, children, required, ...rest }: LabelProps) {
  return (
    <label
      className={twMerge(
        "mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-muted",
        className,
      )}
      {...rest}
    >
      {children}
      {required && <span className="ml-0.5 text-danger">*</span>}
    </label>
  );
}

export default Label;
