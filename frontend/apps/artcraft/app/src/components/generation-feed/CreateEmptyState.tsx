import { type ReactNode } from "react";
import { twMerge } from "tailwind-merge";

const CORNERS = [
  "top-0 left-0",
  "top-0 right-0",
  "bottom-0 left-0",
  "bottom-0 right-0",
];

interface CreateEmptyStateProps {
  title: string;
  subtitle: string;
  children?: ReactNode;
  compact?: boolean;
  className?: string;
}

/** A quiet editorial section with a fine border and corner registration marks. */
export function CreateEmptyState({
  title,
  subtitle,
  children,
  compact = false,
  className,
}: CreateEmptyStateProps) {
  return (
    <section
      className={twMerge(
        "create-empty-section relative w-full max-w-3xl px-6 text-left sm:px-10",
        compact ? "py-8" : "py-10 sm:py-14",
        className,
      )}
    >
      <h1
        className={twMerge(
          "text-balance font-display leading-[1.05] tracking-[-0.035em] text-ui-ink",
          compact ? "text-2xl" : "text-3xl md:text-5xl",
        )}
      >
        {title}
      </h1>
      <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-white/60 sm:text-base">
        {subtitle}
      </p>
      {children && <div className="mt-6">{children}</div>}
      {CORNERS.map((corner) => (
        <span
          key={corner}
          aria-hidden="true"
          className={`frame-corner-mark ${corner}`}
        />
      ))}
    </section>
  );
}
