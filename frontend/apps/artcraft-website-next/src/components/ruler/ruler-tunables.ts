import { defineTunables } from "@/lib/tuner";

// Structure knobs — changing these rebuilds the tick track / word layouts
// (consumers subscribe and debounce, same pattern as the hero wall).
export const rulerLayoutTuner = defineTunables("rulerLayout", "Ruler layout", {
  side: { label: "Side 0=L 1=R", min: 0, max: 1, step: 1, default: 1 },
  railW: { label: "Rail width px", min: 32, max: 96, step: 2, default: 48 },
  minorPct: { label: "Tick every %", min: 0.5, max: 5, step: 0.5, default: 1 },
  labelPct: { label: "Label every %", min: 5, max: 25, step: 5, default: 10 },
  thresholdPct: { label: "Flip line vh%", min: 4, max: 40, step: 1, default: 12 },
  headingPx: { label: "Heading px", min: 12, max: 34, step: 1, default: 20 },
  ridingPx: { label: "Riding px", min: 9, max: 24, step: 1, default: 13 },
  queuePx: { label: "Queue px", min: 9, max: 24, step: 1, default: 12 },
  topPad: { label: "Top pad px", min: 4, max: 120, step: 4, default: 20 },
  currentGap: { label: "Current gap px", min: 8, max: 80, step: 2, default: 26 },
  queueSlot: { label: "Queue slot px", min: 12, max: 48, step: 2, default: 22 },
  queuePad: { label: "Queue bottom px", min: 8, max: 120, step: 4, default: 28 },
  textPad: { label: "Text pad px", min: 0, max: 48, step: 2, default: 14 },
  heroOffset: { label: "Hero anchor up px", min: 0, max: 900, step: 20, default: 260 },
});

// Feel knobs — read per frame.
export const rulerMotionTuner = defineTunables("rulerMotion", "Ruler motion", {
  flipZone: { label: "Flip zone px", min: 60, max: 600, step: 10, default: 180 },
  detachZone: { label: "Detach zone px", min: 60, max: 600, step: 10, default: 220 },
  stagger: { label: "Letter stagger", min: 0, max: 0.3, step: 0.01, default: 0.1 },
  arc: { label: "Curve arc px", min: 0, max: 200, step: 4, default: 56 },
  jumpDur: { label: "Jump dur s", min: 0.2, max: 2.5, step: 0.05, default: 1 },
  snapDelay: { label: "Snap delay ms", min: 100, max: 1500, step: 50, default: 400 },
  snapDur: { label: "Snap dur s", min: 0.2, max: 2, step: 0.05, default: 0.7 },
  introDur: { label: "Intro dur s", min: 0.1, max: 2, step: 0.05, default: 0.7 },
  introStagger: { label: "Intro stag s", min: 0, max: 0.02, step: 0.001, default: 0.004 },
  velRadius: { label: "Vel radius px", min: 0, max: 500, step: 10, default: 180 },
  velMax: { label: "Vel stretch", min: 0, max: 2, step: 0.05, default: 0.6 },
});

// Ink knobs — read per frame.
export const rulerLookTuner = defineTunables("rulerLook", "Ruler look", {
  minorAlpha: { label: "Minor alpha", min: 0, max: 1, step: 0.05, default: 0.3 },
  majorAlpha: { label: "Major alpha", min: 0, max: 1, step: 0.05, default: 0.8 },
  labelAlpha: { label: "Label alpha", min: 0, max: 1, step: 0.05, default: 0.55 },
  minorLen: { label: "Minor len px", min: 2, max: 20, step: 1, default: 8 },
  majorLen: { label: "Major len px", min: 4, max: 28, step: 1, default: 15 },
  ghostAlpha: { label: "Ghost alpha", min: 0, max: 1, step: 0.05, default: 0.9 },
  queueAlpha: { label: "Queue alpha", min: 0, max: 1, step: 0.05, default: 0.55 },
});
