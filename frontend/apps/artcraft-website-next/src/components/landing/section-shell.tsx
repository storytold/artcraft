import type { ReactNode } from "react";

// Structural frame shared by every landing section: a full-bleed top rule,
// content constrained between two continuous side rails, and crosshair ticks
// straddling the rail intersections.
export function SectionShell({
  id,
  children,
  className = "",
  ticks = true,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  ticks?: boolean;
}) {
  return (
    <section id={id} className={`border-t border-line ${className}`}>
      <div className="relative mx-auto max-w-[1280px] border-x border-line">
        {ticks && (
          <>
            <span aria-hidden className="tick -top-[6px] -left-[6px]" />
            <span aria-hidden className="tick -top-[6px] -right-[5px]" />
          </>
        )}
        {children}
      </div>
    </section>
  );
}

// Mono eyebrow row used at the top of a section: index + label on the left,
// optional annotation on the right.
export function SectionEyebrow({
  index,
  label,
  annotation,
}: {
  index: string;
  label: string;
  annotation?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-3 md:px-10">
      <p className="hud-label text-muted">
        <span className="text-faint">{index}</span>
        <span aria-hidden className="mx-2 text-faint">
          /
        </span>
        {label}
      </p>
      {annotation && (
        <p className="hud-label hidden text-faint sm:block">{annotation}</p>
      )}
    </div>
  );
}
