import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { TICKER_ITEMS } from "../data";

// Small mono uppercase micro-label, the backbone of the brutalist metadata
// treatment (coordinates, figure captions, section eyebrows).
export const MonoLabel = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <span
    className={`font-brut-mono text-[11px] uppercase tracking-[0.18em] ${className}`}
  >
    {children}
  </span>
);

// Numbered section header rail: "/03 — FEATURES" above a hairline.
export const SectionHeader = ({
  number,
  label,
  right,
}: {
  number: string;
  label: string;
  right?: ReactNode;
}) => (
  <div className="l4-line flex items-baseline justify-between border-b pb-3">
    <MonoLabel>
      <span className="opacity-100">/{number}</span>
      <span className="l4-muted ml-3">{label}</span>
    </MonoLabel>
    {right ? <MonoLabel className="l4-muted">{right}</MonoLabel> : null}
  </div>
);

// Four plus-sign markers pinned at the corners of a relative parent.
export const PlusCorners = () => (
  <>
    <span aria-hidden className="l4-plus -left-[6px] -top-[6px]" />
    <span aria-hidden className="l4-plus -right-[6px] -top-[6px]" />
    <span aria-hidden className="l4-plus -left-[6px] -bottom-[6px]" />
    <span aria-hidden className="l4-plus -right-[6px] -bottom-[6px]" />
  </>
);

// 1px-bordered media frame with an optional mono caption strip underneath.
export const HairlineFrame = ({
  children,
  caption,
  className = "",
}: {
  children: ReactNode;
  caption?: string;
  className?: string;
}) => (
  <figure className={`relative ${className}`}>
    <div className="l4-line relative overflow-hidden border">{children}</div>
    {caption ? (
      <figcaption className="l4-line l4-muted flex items-center justify-between border-x border-b px-3 py-2">
        <MonoLabel>{caption}</MonoLabel>
        <MonoLabel aria-hidden>+</MonoLabel>
      </figcaption>
    ) : null}
  </figure>
);

// Headline pre-split into lines, each wrapped in an overflow mask so GSAP can
// stagger the inner spans up into view. `lines` accepts ReactNodes so callers
// can color or outline individual words. Tag with data-l4-line-group so the
// animation module can find each group and its [data-l4-line] children.
export const LineMaskHeading = ({
  lines,
  className = "",
  as: Tag = "h2",
}: {
  lines: ReactNode[];
  className?: string;
  as?: "h1" | "h2";
}) => (
  <Tag
    data-l4-line-group
    className={`font-brut-display font-bold uppercase leading-[0.86] tracking-[-0.02em] ${className}`}
  >
    {lines.map((line, i) => (
      <span key={i} className="l4-line-mask">
        <span data-l4-line>{line}</span>
      </span>
    ))}
  </Tag>
);

// Full-bleed flare marquee band. Content duplicated x2; the CSS animation
// translates -50% for a seamless loop (static under prefers-reduced-motion).
export const Ticker = () => {
  const copy = (
    <div className="flex shrink-0 items-center">
      {TICKER_ITEMS.map((item) => (
        <span
          key={item}
          className="font-brut-mono px-6 text-[13px] font-bold uppercase tracking-[0.2em]"
        >
          {item} <span className="ml-10">✳</span>
        </span>
      ))}
    </div>
  );
  return (
    <div
      aria-hidden
      className="border-ink/20 bg-flare text-ink flex h-12 items-center overflow-hidden border-y"
    >
      <div className="l4-ticker-track">
        {copy}
        {copy}
      </div>
    </div>
  );
};

// Lazy autoplay video: defers fetch + decoder spin-up until the element nears
// the viewport (same pattern as landing3's LazyAutoplayVideo).
export const LazyAutoplayVideo = ({
  src,
  className,
}: {
  src: string;
  className?: string;
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!ref.current || shouldLoad) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "150% 0px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <video
      ref={ref}
      className={className}
      autoPlay
      loop
      muted
      playsInline
      preload={shouldLoad ? "auto" : "none"}
      src={shouldLoad ? src : undefined}
    />
  );
};
