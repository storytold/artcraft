"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { introClock, introTuner, onIntroReplay } from "@/lib/intro";

gsap.registerPlugin(ScrollTrigger);

const HIDDEN = { autoAlpha: 0, y: 28, filter: "blur(8px)" } as const;
// clearProps on settle: a lingering `filter: blur(0px)` keeps the element on a
// composited layer, which disables subpixel text antialiasing on Windows.
const SHOWN = {
  autoAlpha: 1,
  y: 0,
  filter: "blur(0px)",
  duration: 0.9,
  ease: "power3.out",
  overwrite: true,
  clearProps: "all",
} as const;

// Progressive-enhancement scroll reveals for `[data-reveal]` elements.
//
// Elements render fully visible in the server HTML (crawlers and no-JS
// visitors see everything). Only once JS runs — and only for visitors without
// a reduced-motion preference — do we hide them and reveal on scroll.
// `data-reveal-group` on a container staggers its `[data-reveal]` children.
export default function RevealManager() {
  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.utils
        .toArray<HTMLElement>(
          "[data-reveal]:not([data-reveal-group] [data-reveal])",
        )
        .forEach((el) => {
          gsap.set(el, HIDDEN);
          ScrollTrigger.create({
            trigger: el,
            start: "top 85%",
            once: true,
            onEnter: () => gsap.to(el, SHOWN),
          });
        });

      const introCleanups: (() => void)[] = [];
      gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
        const children = Array.from(
          group.querySelectorAll<HTMLElement>("[data-reveal]"),
        );
        if (!children.length) return;
        gsap.set(children, HIDDEN);
        // Hero groups play on the master intro's copy beat instead of a
        // scroll trigger — they're above the fold on load, and firing
        // immediately would land the pitch before the brand has formed.
        // The tuner's replay re-hides and re-arms them.
        if (group.closest("#hero")) {
          let wait: gsap.TickerCallback | null = null;
          const arm = () => {
            if (wait) gsap.ticker.remove(wait);
            gsap.set(children, HIDDEN);
            const cb: gsap.TickerCallback = () => {
              if (introClock.t < introTuner.read().copyAt) return;
              gsap.to(children, { ...SHOWN, stagger: 0.08 });
              gsap.ticker.remove(cb);
              if (wait === cb) wait = null;
            };
            wait = cb;
            gsap.ticker.add(cb);
          };
          arm();
          introCleanups.push(onIntroReplay(arm));
          introCleanups.push(() => {
            if (wait) gsap.ticker.remove(wait);
          });
          return;
        }
        ScrollTrigger.create({
          trigger: group,
          start: "top 85%",
          once: true,
          onEnter: () => gsap.to(children, { ...SHOWN, stagger: 0.08 }),
        });
      });

      return () => {
        introCleanups.forEach((fn) => fn());
      };
    });

    return () => mm.revert();
  }, []);

  return null;
}
