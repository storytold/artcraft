import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import Link from "next/link";
import { LoaderCircleIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

/*
 * Core button, ported from @storyteller/ui-button and re-tokened for the
 * marketing site's theme variables so both light and dark render correctly.
 * Mono uppercase label, hard edges, no radius. "primary" is the solid
 * invert-block CTA (navbar "Launch App" style); "secondary" is the hairline
 * outline that inverts on hover.
 */

type ButtonVariant =
  | "primary"
  | "secondary"
  | "action"
  | "destructive"
  | "ghost";

type ButtonSize = "sm" | "md" | "lg";

const BASE_CLASSES =
  "inline-flex w-fit items-center justify-center gap-2 rounded-none font-mono font-bold uppercase tracking-[0.12em] whitespace-nowrap transition-colors duration-150";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-invert-bg text-invert-fg transition-opacity hover:opacity-80",
  secondary:
    "invert-block border border-line-strong text-ink hover:border-transparent",
  action: "border border-line bg-bg-raised text-ink hover:border-line-strong",
  destructive: "bg-danger text-white transition-opacity hover:opacity-80",
  ghost: "text-muted hover:bg-invert-bg hover:text-invert-fg",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-[11px]",
  md: "px-4 py-2 text-[11px]",
  lg: "h-12 px-6 text-[11px]",
};

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders an anchor (next/link for internal paths) instead of a button. */
  href?: string;
  /** Forces a plain <a> even for internal-looking hrefs. */
  external?: boolean;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  href,
  external = false,
  loading = false,
  disabled,
  className,
  children,
  target,
  rel,
  type,
  ...rest
}: ButtonProps) {
  const classes = twMerge(
    BASE_CLASSES,
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    (disabled || loading) && "pointer-events-none opacity-50",
    className,
  );

  const content: ReactNode = (
    <>
      {loading && (
        <LoaderCircleIcon aria-hidden className="h-4 w-4 animate-spin" />
      )}
      {children}
    </>
  );

  if (href) {
    const anchorProps =
      rest as unknown as AnchorHTMLAttributes<HTMLAnchorElement>;
    if (external || /^(https?:\/\/|mailto:)/.test(href)) {
      return (
        <a
          href={href}
          target={target}
          rel={rel}
          className={classes}
          {...anchorProps}
        >
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...anchorProps}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type ?? "button"}
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {content}
    </button>
  );
}

export default Button;
