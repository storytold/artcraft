"use client";

import { useEffect } from "react";
import gsap from "gsap";
import {
  INTRO_SEEN_KEY,
  introClock,
  introFastForward,
  introTuner,
  onIntroReplay,
} from "@/lib/intro";

// Drives the master intro clock (see lib/intro.ts) and owns the navbar's
// reveal — the one intro piece with no component of its own. Everything
// else (wordmark formation, ruler cascade, copy stack, galaxy rollout)
// reads the clock from inside its owner.
export default function IntroConductor() {
  useEffect(() => {
    // Reduced motion: the page opens settled — park the clock far past
    // every beat and touch nothing.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      introClock.t = 999;
      introClock.done = true;
      return;
    }

    const it = introTuner.read();
    let returning = false;
    try {
      returning = localStorage.getItem(INTRO_SEEN_KEY) === "1";
    } catch {
      // Storage unavailable — treat as a fresh visit.
    }
    introClock.t = 0;
    introClock.done = false;
    introClock.scale = returning ? it.returnScale : 1;

    // Navbar reveal: chrome (the bar and its hairline) stays; the CONTENTS
    // stagger in at the instrument beat, alongside the ruler's cascade.
    // A lead-in tween carries the delay so timeScale accelerates it too.
    const navCells = gsap.utils.toArray<HTMLElement>("#site-nav > div > *");
    let navTl: gsap.core.Timeline | null = null;
    const runNav = () => {
      if (!navCells.length) return;
      navTl?.kill();
      gsap.set(navCells, { autoAlpha: 0, y: -6 });
      navTl = gsap.timeline();
      navTl.to({}, { duration: introTuner.read().instrAt });
      navTl.to(navCells, {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
        clearProps: "all",
      });
      navTl.timeScale(introClock.scale);
    };
    runNav();

    const onInput = () => {
      introFastForward();
      navTl?.timeScale(introTuner.read().ffScale);
    };
    const attachInput = () => {
      window.addEventListener("wheel", onInput, { passive: true });
      window.addEventListener("pointerdown", onInput, { passive: true });
      window.addEventListener("keydown", onInput);
      window.addEventListener("touchstart", onInput, { passive: true });
    };
    const removeInput = () => {
      window.removeEventListener("wheel", onInput);
      window.removeEventListener("pointerdown", onInput);
      window.removeEventListener("keydown", onInput);
      window.removeEventListener("touchstart", onInput);
    };
    attachInput();

    // Tuner debug replay: the clock is already rewound; rebuild the nav
    // reveal and re-arm the fast-forward listeners.
    const offReplay = onIntroReplay(() => {
      removeInput();
      attachInput();
      runNav();
    });

    const tick = (_t: number, deltaMs: number) => {
      introClock.t += (Math.min(deltaMs, 100) / 1000) * introClock.scale;
      // Done once the last beat plus its longest consumer has played out.
      if (!introClock.done && introClock.t > introTuner.read().cardsAt + 3) {
        introClock.done = true;
        // Drop the pre-paint letter-hide rule (inline styles already won).
        document.documentElement.removeAttribute("data-intro");
        try {
          localStorage.setItem(INTRO_SEEN_KEY, "1");
        } catch {
          // Storage unavailable — they'll just get the full intro again.
        }
        removeInput();
      }
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      offReplay();
      removeInput();
      navTl?.kill();
      // A dev-time remount must not strand a hidden navbar.
      if (navCells.length) gsap.set(navCells, { clearProps: "all" });
      introClock.t = 999;
    };
  }, []);

  return null;
}
