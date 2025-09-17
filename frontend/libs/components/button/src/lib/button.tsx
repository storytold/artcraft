import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";
import { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";

type AnchorProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof ButtonHTMLAttributes<HTMLButtonElement>
>;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: IconDefinition;
  iconClassName?: string;
  iconFlip?: boolean;
  htmlFor?: string;
  variant?: "primary" | "secondary" | "action" | "destructive" | "ghost";
  loading?: boolean;
  as?: "button" | "link";
  href?: string;
  target?: string;
}

export const Button = ({
  icon,
  iconClassName,
  children,
  className: propsClassName,
  htmlFor,
  variant: propsVariant = "primary",
  disabled,
  iconFlip = false,
  loading,
  as = "button",
  href,
  target,
  ...rest
}: ButtonProps) => {
  function getVariantClassNames(variant: string) {
    switch (variant) {
      case "secondary": {
        return "bg-ui-controls text-base-fg border border-ui-controls-border hover:bg-ui-controls/80 focus-visible:outline-secondary";
      }
      case "action": {
        return "bg-ui-controls text-base-fg border border-ui-controls-border hover:bg-ui-controls/80 focus-visible:outline-action";
      }
      case "destructive": {
        return "bg-red hover:bg-red/90 text-white focus-visible:outline-red";
      }
      case "ghost": {
        return "bg-transparent text-base-fg border border-ui-controls-border/70 hover:bg-ui-controls/30 focus-visible:outline-primary-600";
      }
      case "primary":
      default: {
        return "bg-primary hover:bg-primary-400 text-white focus-visible:outline-primary-600";
      }
    }
  }

  const disabledClass = twMerge(
    disabled || loading ? "opacity-50 pointer-events-none" : ""
  );

  const className = twMerge(
    "w-fit text-sm font-medium rounded-lg px-3 py-2 border border-transparent shadow-sm focus-visible:outline focus-visible:outline-0 focus-visible:outline-offset-0 transition-all duration-150 flex gap-2 items-center justify-center active:scale-95 transform",
    getVariantClassNames(propsVariant),
    propsClassName,
    disabledClass
  );

  if (htmlFor) {
    return (
      <label className={className} htmlFor={htmlFor} style={rest.style}>
        {loading && !iconFlip ? (
          <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
        ) : (
          <>
            {icon && !iconFlip ? (
              <FontAwesomeIcon icon={icon} className={iconClassName} />
            ) : null}
          </>
        )}
        {children}
        {loading && iconFlip ? (
          <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
        ) : (
          <>
            {icon && iconFlip ? (
              <FontAwesomeIcon icon={icon} className={iconClassName} />
            ) : null}
          </>
        )}
      </label>
    );
  }

  if (as === "link" && href) {
    return (
      <a
        href={href}
        className={className}
        style={rest.style}
        {...(rest as unknown as AnchorProps)}
        target={target}
      >
        {loading && !iconFlip ? (
          <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
        ) : (
          <>
            {icon && !iconFlip ? (
              <FontAwesomeIcon icon={icon} className={iconClassName} />
            ) : null}
          </>
        )}
        {children}
        {loading && iconFlip ? (
          <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
        ) : (
          <>
            {icon && iconFlip ? (
              <FontAwesomeIcon icon={icon} className={iconClassName} />
            ) : null}
          </>
        )}
      </a>
    );
  }

  return (
    <button
      className={className}
      disabled={disabled || loading}
      {...{ ...rest, htmlFor }}
    >
      {loading && !iconFlip ? (
        <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
      ) : (
        <>
          {icon && !iconFlip ? (
            <FontAwesomeIcon icon={icon} className={iconClassName} />
          ) : null}
        </>
      )}
      {children}
      {loading && iconFlip ? (
        <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
      ) : (
        <>
          {icon && iconFlip ? (
            <FontAwesomeIcon icon={icon} className={iconClassName} />
          ) : null}
        </>
      )}
    </button>
  );
};

export default Button;
