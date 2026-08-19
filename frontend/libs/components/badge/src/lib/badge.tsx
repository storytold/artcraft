import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface BadgeProps {
  label: string;
  color?: string;
  className?: string;
  icon?: ReactNode;
}

export const Badge = ({ label, className, icon }: BadgeProps) => {
  return (
    <div
      className={twMerge(
        "flex items-center gap-1 rounded-none border border-ui-controls-border bg-black/40 px-1.5 py-px font-mono text-[10px] font-medium uppercase tracking-[0.1em]",
        className
      )}
    >
      {icon}
      {label}
    </div>
  );
};
