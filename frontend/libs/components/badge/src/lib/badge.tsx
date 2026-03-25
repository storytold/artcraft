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
        "flex items-center gap-1 rounded-[6px] bg-ui-controls/45 px-[4px] py-[1px] text-[10px] shadow-sm",
        className
      )}
    >
      {icon}
      {label}
    </div>
  );
};
