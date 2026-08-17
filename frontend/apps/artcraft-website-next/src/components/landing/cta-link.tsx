import type { ReactNode } from "react";
import Link from "next/link";

const BASE =
  "hud-label inline-flex h-12 items-center justify-center gap-2 px-6 font-bold transition-opacity";

const VARIANTS = {
  solid: "bg-invert-bg text-invert-fg hover:opacity-80",
  outline:
    "invert-block border border-line-strong text-ink hover:border-transparent",
} as const;

export default function CtaLink({
  href,
  variant = "solid",
  external = false,
  children,
}: {
  href: string;
  variant?: keyof typeof VARIANTS;
  external?: boolean;
  children: ReactNode;
}) {
  const className = `${BASE} ${VARIANTS[variant]}`;
  if (external || /^https?:\/\//.test(href)) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
