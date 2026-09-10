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
 * happens as the visitor leaves the landing area). `bottom` is the document
 * Y of the section's end, used to derive the end-of-page flip for sections
 * too short to ever reach the threshold. */
export type MeasuredSection = {
  id: string;
  label: string;
  index: number;
  anchor: number;
  bottom: number;
  isHero: boolean;
};

/** The zoom morph's shared per-frame state: ScrollRuler drives it (hover
 * intent, drag, damped integration of `p`), HeadingFlow reads `p` to blend
 * the heading lifecycle toward the compact map. 0 = 1:1 instrument,
 * 1 = compressed full-page map. */
export const rulerZoom = { target: 0, p: 0, dragging: false };

/** Screen-space y-spans of the heading words' settled riding columns.
 * HeadingFlow rewrites it every frame; the tick loop fades percent labels
 * within a margin of any span (proximity yield — the scale gets out of a
 * passing word's way). `k` ramps 0→1 with how on-rail the word is, so the
 * yield eases in/out with the detach/flip transitions instead of blinking
 * as letters fly past. */
export const railOccupancy: {
  spans: { top: number; bottom: number; k: number }[];
} = {
  spans: [],
};

/** The ruler's vertical mapping: progress/percent p ∈ [0,1] maps onto
 * [NAV_H + pad, vh − pad] — in BOTH the 1:1 and compact states, so the
 * needle-meets-its-tick invariant stays exact and the endpoint ticks
 * (with their 0/100 labels) always rest fully inside the viewport.
 * `drift(p)` is the track offset reconciling the 1:1 layout with the
 * needle's travel; pad = 0 degenerates to the old NAV_H·(1−p). */
export function rulerMap(vh: number, pad: number) {
  const base = NAV_H + pad;
  return {
    base,
    span: Math.max(1, vh - NAV_H - 2 * pad),
    drift: (p: number) => base - p * (NAV_H + 2 * pad),
  };
}

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export const easeOutExpo = (t: number) =>
  t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);

export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
