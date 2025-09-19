import { twMerge } from "tailwind-merge";

interface BadgeProps {
  label: string;
  color?: string;
  className?: string;
}

export const Badge = ({ label, className }: BadgeProps) => {
  return (
    <div
      className={twMerge(
        "rounded-[6px] bg-ui-controls/45 px-[4px] py-[1px] text-[10px] shadow-sm",
        className
      )}
    >
      {label}
    </div>
  );
};
