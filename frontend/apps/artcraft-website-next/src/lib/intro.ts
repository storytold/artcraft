// The page-intro conductor: one master clock every intro consumer reads,
// so the whole opening choreographs as a single sequence —
//
//   the mark arrives (logo alone, centered)
//   → it names itself (letters slide out from behind the logo)
//   → the instrument assembles (ruler tick cascade + navbar contents)
//   → the pitch lands (copy stack reveals)
//   → the work pours out (galaxy cards roll from the center to their
//     conveyor positions along their arms).
//
// `introClock.t` is monotonic intro-time in seconds, advanced by the
// IntroConductor component from gsap.ticker deltas. Any user input
// fast-forwards the clock (ffScale) — nothing jump-cuts, everything
// accelerates. Repeat visitors (localStorage flag) run the whole intro
// compressed from the start. Reduced-motion visitors get the settled
// page immediately (t starts far past every beat).
//
// gsap-driven intro pieces (which run on their own clocks) register with
// onIntroFast so a fast-forward accelerates them in the same gesture.

import { defineTunables } from "@/lib/tuner";

export const introTuner = defineTunables("intro", "Intro", {
  wordAt: {
    label: "Word at s",
    min: 0,
    max: 2,
    step: 0.05,
    default: 0.35,
    info: "When the letters start sliding out from behind the logo (the logo itself fades in at 0).",
  },
  wordDur: {
    label: "Word dur s",
    min: 0.2,
    max: 2,
    step: 0.05,
    default: 0.85,
    info: "How long the whole word-formation takes — the logo's glide to its slot spans this window.",
  },
  wordStagger: {
    label: "Word stag s",
    min: 0,
    max: 0.2,
    step: 0.01,
    default: 0.06,
    info: "Delay between successive letters emerging from behind the logo, left to right.",
  },
  instrAt: {
    label: "Instrument s",
    min: 0,
    max: 3,
    step: 0.05,
    default: 0.7,
    info: "When the instrument assembles: the ruler's tick cascade begins and the navbar contents stagger in.",
  },
  copyAt: {
    label: "Copy at s",
    min: 0,
    max: 3,
    step: 0.05,
    default: 1.05,
    info: "When the central copy stack (headline, subline, CTAs, proof) starts its reveal.",
  },
  cardsAt: {
    label: "Cards at s",
    min: 0,
    max: 3,
    step: 0.05,
    default: 1.15,
    info: "When the galaxy cards start rolling out from the center along their arms.",
  },
  ffScale: {
    label: "Skip speed ×",
    min: 1,
    max: 10,
    step: 0.5,
    default: 4,
    info: "Timeline acceleration when the visitor scrolls, clicks, or presses a key during the intro — fast-forward, never a jump cut.",
  },
  returnScale: {
    label: "Return speed ×",
    min: 1,
    max: 6,
    step: 0.5,
    default: 2.5,
    info: "Timeline acceleration for repeat visitors (localStorage flag) — they get the whole intro, much shorter.",
  },
});

export const introClock = {
  /** Monotonic intro-time, seconds. Starts far past every beat when the
   * visitor prefers reduced motion. */
  t: 0,
  /** Current playback rate: 1 fresh visit, returnScale on repeat visits,
   * ffScale once the visitor gives any input mid-intro. */
  scale: 1,
  done: false,
};

export const INTRO_SEEN_KEY = "artcraft-intro-seen";

const fastCbs = new Set<() => void>();

/** Register a callback fired when the intro fast-forwards (user input) —
 * gsap-driven intro pieces accelerate their own timelines here. Returns an
 * unsubscribe. */
export function onIntroFast(cb: () => void): () => void {
  fastCbs.add(cb);
  return () => {
    fastCbs.delete(cb);
  };
}

export function introFastForward(): void {
  const ff = introTuner.read().ffScale;
  if (introClock.done || introClock.scale >= ff) return;
  introClock.scale = ff;
  fastCbs.forEach((cb) => cb());
}
