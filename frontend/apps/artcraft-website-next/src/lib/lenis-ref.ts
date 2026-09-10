import type Lenis from "lenis";

// The live Lenis instance, published by MotionProvider for anything that
// needs programmatic smooth scrolling (the scroll ruler's jumps and snap).
// null before mount and for reduced-motion visitors — consumers must fall
// back to native scrolling.
export const lenisRef: { current: Lenis | null } = { current: null };
