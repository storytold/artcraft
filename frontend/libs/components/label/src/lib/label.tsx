import { LabelHTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
  children: ReactNode;
  required?: boolean;
}

export const Label = ({
  className,
  children,
  required,
  ...rest
}: LabelProps) => (
  <label
    className={twMerge("text-base-fg mb-2 text-[15px] font-medium", className)}
    {...rest}
  >
    {children}
    {required && <span className="ml-0.5 text-[#ff6467]">*</span>}
  </label>
);

export default Label;
