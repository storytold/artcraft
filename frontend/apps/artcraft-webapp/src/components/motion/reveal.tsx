// Reveal — the webapp's reusable entrance primitive.
//
// Wraps content in a fade-and-lift that plays once when the element scrolls
// into view (or immediately on mount for above-the-fold content). It reuses the
// shared motion tokens so every page enters with the same restrained, premium
// cadence rather than each surface hand-rolling its own.
//
// Two pieces:
//   <RevealGroup>  — a stagger container; its <Reveal> children cascade in.
//   <Reveal>       — a single fade-up element (works standalone or as a child).
//
// Both respect `prefers-reduced-motion`: motion collapses to a plain, instant
// presence so the layout never moves for users who opt out.

import type { ElementType, ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { DUR_SLOW, EASE_OUT } from "../../lib/motion";

// `motion(as)` returns a BRAND-NEW component on every call. Calling it during
// render would hand each render a different component type, so React would
// unmount and remount the whole subtree on every re-render — stealing focus
// from any <input> inside (this is what broke the login form: typing a
// character re-rendered the page and blurred the field). Cache one motion
// component per element type so the reference stays stable across renders.
const motionTagCache = new Map<ElementType, ElementType>();

function motionTag(as: ElementType): ElementType {
  let cached = motionTagCache.get(as);
  if (!cached) {
    cached = motion(as) as ElementType;
    motionTagCache.set(as, cached);
  }
  return cached;
}

interface RevealProps {
  children: ReactNode;
  /** Render as a different element/component (e.g. "section", "li", Link). */
  as?: ElementType;
  /** Extra delay (seconds) before this element animates. */
  delay?: number;
  /** Travel distance for the lift, in px. Defaults to a gentle 16. */
  y?: number;
  /** Play once when scrolled into view (default) vs. immediately on mount. */
  inView?: boolean;
  className?: string;
}

/**
 * Stagger container. Place <Reveal> children inside and they fade up in
 * sequence. Use for grids, card rows, and stacked content blocks.
 */
export function RevealGroup({
  children,
  as = "div",
  stagger = 0.07,
  delayChildren = 0.04,
  inView = true,
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  stagger?: number;
  delayChildren?: number;
  inView?: boolean;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const MotionTag = motionTag(as);

  const variants: Variants = {
    initial: {},
    animate: {
      transition: reduceMotion
        ? {}
        : { staggerChildren: stagger, delayChildren },
    },
  };

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="initial"
      {...(inView
        ? { whileInView: "animate", viewport: { once: true, margin: "-10%" } }
        : { animate: "animate" })}
    >
      {children}
    </MotionTag>
  );
}

export function Reveal({
  children,
  as = "div",
  delay = 0,
  y = 16,
  inView,
  className,
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const MotionTag = motionTag(as);

  // When `inView` is left undefined the element behaves as a stagger child:
  // it inherits the parent RevealGroup's orchestration and must NOT drive its
  // own initial/animate props (that would override the cascade).
  const standalone = inView !== undefined;

  // Only a standalone reveal sets its own `delay`. For a stagger child the
  // delay MUST be omitted: framer-motion lets a child's explicit transition
  // `delay` override the parent's `staggerChildren`/`delayChildren`, so leaving
  // it in (even as 0) collapses the cascade and every child animates at once.
  const variants: Variants = {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: DUR_SLOW,
        ease: EASE_OUT,
        ...(standalone ? { delay } : {}),
      },
    },
  };

  return (
    <MotionTag
      className={className}
      variants={variants}
      {...(standalone
        ? inView
          ? {
              initial: "initial",
              whileInView: "animate",
              viewport: { once: true, margin: "-10%" },
            }
          : { initial: "initial", animate: "animate" }
        : {})}
    >
      {children}
    </MotionTag>
  );
}
