import { Link, LinkProps } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { twMerge } from "tailwind-merge";

interface LinkButtonProps extends LinkProps {
  icon?: LucideIcon;
  variant?: "primary" | "secondary";
}

export const ButtonLink = ({
  icon,
  children,
  className: propsClassName,
  variant = "primary",
  ...rest
}: LinkButtonProps) => {
  //TODO: Duplicated from Button.tsx
  function getVariantClassNames(variant: string) {
    switch (variant) {
      case "secondary": {
        return "bg-transparent text-base-fg border border-ui-controls-border hover:bg-white/10 hover:border-white/30";
      }
      case "primary":
      default: {
        return "bg-white hover:bg-white/80 text-black font-bold";
      }
    }
  }
  const baseClassName =
    "font-mono text-xs font-semibold uppercase tracking-[0.12em] whitespace-nowrap rounded-[3px] px-3.5 py-2 border border-transparent focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white/60 transition-colors duration-150";
  const variantClassNames = getVariantClassNames(variant);
  const className = twMerge(baseClassName, variantClassNames, propsClassName);
  // END TODO

  return (
    <Link {...rest}>
      <button className={className}>
        {icon && <DynamicIcon className="mr-2" icon={icon} size="0.875em" />}
        {children}
      </button>
    </Link>
  );
};
