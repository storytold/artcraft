"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

      gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
        const children = Array.from(
          group.querySelectorAll<HTMLElement>("[data-reveal]"),
        );
        if (!children.length) return;
        gsap.set(children, HIDDEN);
        ScrollTrigger.create({
          trigger: group,
          start: "top 85%",
          once: true,
          onEnter: () => gsap.to(children, { ...SHOWN, stagger: 0.08 }),
        });
      });
    });

    return () => mm.revert();
  }, []);

  return null;
}
