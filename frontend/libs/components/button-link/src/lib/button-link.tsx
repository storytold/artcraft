import { Link, LinkProps } from "react-router-dom";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";

interface LinkButtonProps extends LinkProps {
  icon?: IconDefinition;
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
        return "bg-brand-secondary hover:bg-brand-secondary-600 text-white focus-visible:outline-brand-secondary";
      }
      case "primary":
      default: {
        return "bg-brand-primary hover:bg-brand-primary-400 text-white focus-visible:outline-brand-primary-600";
      }
    }
  }
  const baseClassName =
    "text-sm font-medium whitespace-nowrap rounded-lg px-3 py-2 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all duration-150";
  const variantClassNames = getVariantClassNames(variant);
  const className = twMerge(baseClassName, variantClassNames, propsClassName);
  // END TODO

  return (
    <Link {...rest}>
      <button className={className}>
        {icon && <FontAwesomeIcon className="mr-2" icon={icon} size="sm" />}
        {children}
      </button>
    </Link>
  );
};
