"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { introClock, introTuner } from "@/lib/intro";

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

      const introTickers: gsap.TickerCallback[] = [];
      gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
        const children = Array.from(
          group.querySelectorAll<HTMLElement>("[data-reveal]"),
        );
        if (!children.length) return;
        gsap.set(children, HIDDEN);
        // Hero groups play on the master intro's copy beat instead of a
        // scroll trigger — they're above the fold on load, and firing
        // immediately would land the pitch before the brand has formed.
        if (group.closest("#hero")) {
          const wait: gsap.TickerCallback = () => {
            if (introClock.t < introTuner.read().copyAt) return;
            gsap.to(children, { ...SHOWN, stagger: 0.08 });
            gsap.ticker.remove(wait);
          };
          introTickers.push(wait);
          gsap.ticker.add(wait);
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
        introTickers.forEach((cb) => gsap.ticker.remove(cb));
      };
    });

    return () => mm.revert();
  }, []);

  return null;
}
