import { type ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/pro-solid-svg-icons";

interface MobileFieldButtonProps {
  label: string;
  value?: ReactNode;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

// A single tappable settings row: [icon] Label …… value [chevron].
export function MobileFieldButton({
  label,
  value,
  icon,
  onClick,
  disabled,
  className,
}: MobileFieldButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={twMerge(
        "flex w-full items-center gap-3 rounded-xl border border-ui-panel-border bg-ui-controls px-3.5 py-3 text-left transition-colors",
        "hover:bg-ui-controls/80 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {icon && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-base-fg/70">
          {icon}
        </span>
      )}
      <span className="shrink-0 text-sm font-medium text-base-fg/70">
        {label}
      </span>
      <span className="ml-auto flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-semibold text-base-fg">
          {value}
        </span>
        <FontAwesomeIcon
          icon={faChevronRight}
          className="h-3 w-3 shrink-0 text-base-fg/40"
        />
      </span>
    </button>
  );
}
