import { LoaderCircleIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { twMerge } from "tailwind-merge";
import { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

type AnchorProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof ButtonHTMLAttributes<HTMLButtonElement>
>;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon;
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
        return "bg-transparent text-base-fg border border-ui-controls-border hover:bg-white/10 hover:border-white/30";
      }
      case "action": {
        return "bg-ui-controls text-base-fg border border-ui-controls-border hover:bg-ui-controls/80";
      }
      case "destructive": {
        return "bg-red-500 hover:bg-red-400 text-white";
      }
      case "ghost": {
        return "bg-transparent text-base-fg/70 hover:bg-white/10 hover:text-base-fg";
      }
      case "primary":
      default: {
        return "bg-white hover:bg-white/80 text-black font-bold";
      }
    }
  }

  const disabledClass = twMerge(
    disabled || loading ? "opacity-50 pointer-events-none" : "",
  );

  const className = twMerge(
    "w-fit rounded-[3px] font-mono text-xs font-semibold uppercase tracking-[0.15em] px-3.5 py-2 border border-transparent focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white/60 transition-colors duration-150 flex gap-2 items-center justify-center",
    getVariantClassNames(propsVariant),
    propsClassName,
    disabledClass,
  );

  if (htmlFor) {
    return (
      <label className={className} htmlFor={htmlFor} style={rest.style}>
        {loading && !iconFlip ? (
          <LoaderCircleIcon className="animate-spin" />
        ) : (
          <>
            {icon && !iconFlip ? (
              <DynamicIcon icon={icon} className={iconClassName} />
            ) : null}
          </>
        )}
        {children}
        {loading && iconFlip ? (
          <LoaderCircleIcon className="animate-spin" />
        ) : (
          <>
            {icon && iconFlip ? (
              <DynamicIcon icon={icon} className={iconClassName} />
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
          <LoaderCircleIcon className="animate-spin" />
        ) : (
          <>
            {icon && !iconFlip ? (
              <DynamicIcon icon={icon} className={iconClassName} />
            ) : null}
          </>
        )}
        {children}
        {loading && iconFlip ? (
          <LoaderCircleIcon className="animate-spin" />
        ) : (
          <>
            {icon && iconFlip ? (
              <DynamicIcon icon={icon} className={iconClassName} />
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
        <LoaderCircleIcon className="animate-spin" />
      ) : (
        <>
          {icon && !iconFlip ? (
            <DynamicIcon icon={icon} className={iconClassName} />
          ) : null}
        </>
      )}
      {children}
      {loading && iconFlip ? (
        <LoaderCircleIcon className="animate-spin" />
      ) : (
        <>
          {icon && iconFlip ? (
            <DynamicIcon icon={icon} className={iconClassName} />
          ) : null}
        </>
      )}
    </button>
  );
};

export default Button;
