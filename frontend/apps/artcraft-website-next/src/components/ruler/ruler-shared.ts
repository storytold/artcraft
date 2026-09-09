// Shared bits for the scroll ruler instrument (see scroll-ruler.tsx for the
// big picture).

/** Height of the sticky SiteNav (h-12). The rail hides under it; the needle's
 * travel and the click→progress mapping run over [NAV_H, viewport bottom]. */
export const NAV_H = 48;

/** "full" = the whole instrument, native scrollbar hidden. "static" = the
 * reduced-motion rail: ticks + needle + plain section links, native
 * scrollbar kept. Coarse pointers and small screens get no ruler at all. */
export type RulerMode = "full" | "static";

export type RulerSide = "left" | "right";

/** A ruler section resolved against the live DOM. `anchor` is the document Y
 * the section's word rides at (the section top — except the hero, whose
 * anchor hangs `heroOffset` above the hero's bottom so the wordmark handoff
 * happens as the visitor leaves the landing area). */
export type MeasuredSection = {
  id: string;
  label: string;
  index: number;
  anchor: number;
  isHero: boolean;
};

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export const easeOutExpo = (t: number) =>
  t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);

export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
