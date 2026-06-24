// Shared motion tokens for the webapp.
//
// These mirror the CSS custom properties defined in `src/styles.css` (`--ease-*`,
// `--dur-*`) so framer-motion animations and plain CSS transitions stay in sync.
// The "balanced" motion direction: chrome and navigation are restrained and fast;
// the creative canvas (3D drops, gallery, pagedraw) is where motion gets to be
// expressive. Reach for these instead of hand-writing curves and durations.

import type { Transition, Variants } from "framer-motion";

// ── Easing curves (cubic-bezier control points) ───────────────────────────────
// Tuples are typed as 4-number arrays so framer-motion accepts them as `ease`.

/** Decelerate-to-rest. The default for elements entering the screen. */
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
/** Symmetric ease for elements that move and settle in place. */
export const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1];
/** Gentle overshoot for playful, tactile moments (pills, badges, drops). */
export const EASE_SPRING: [number, number, number, number] = [0.34, 1.56, 0.64, 1];
/** Apple/Linear "expo" curve for confident, premium slides. */
export const EASE_EMPHASIS: [number, number, number, number] = [0.32, 0.72, 0, 1];

// ── Durations (seconds, to match framer-motion's unit) ────────────────────────

export const DUR_FAST = 0.14;
export const DUR_BASE = 0.22;
export const DUR_SLOW = 0.34;
export const DUR_PAGE = 0.26;

// ── Ready-made transition presets ─────────────────────────────────────────────

/** Quick, restrained transition for chrome (nav, hovers, toggles). */
export const TRANSITION_CHROME: Transition = {
  duration: DUR_BASE,
  ease: EASE_OUT,
};

/** The global page/route transition — fast and unobtrusive. */
export const TRANSITION_PAGE: Transition = {
  duration: DUR_PAGE,
  ease: EASE_OUT,
};

/** Tactile spring for expressive bits that should feel physical. */
export const TRANSITION_SPRING: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 30,
  mass: 0.9,
};

// ── Reusable variants ─────────────────────────────────────────────────────────

/**
 * Opacity-only page enter. Deliberately avoids `transform`/`filter`: a lingering
 * transform on a route wrapper would establish a containing block and re-scope
 * `position: fixed` page chrome (promptboxes, editor toolbars) to the wrapper
 * instead of the viewport. Fading is the safe, premium choice here — the
 * expressive vertical motion lives inside individual pages, not the shell.
 */
export const pageFadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: TRANSITION_PAGE },
  exit: { opacity: 0, transition: { duration: DUR_FAST, ease: EASE_OUT } },
};

/** Fade-and-lift for content that is safe to translate (no fixed children). */
export const fadeUpVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: TRANSITION_CHROME },
  exit: { opacity: 0, y: 6, transition: { duration: DUR_FAST, ease: EASE_OUT } },
};

/** Parent variant that staggers children using `fadeUpVariants` (or similar). */
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};
