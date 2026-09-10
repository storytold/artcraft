"use client";

import { useEffect, useRef, useState } from "react";
import { heroWordmark } from "@/components/ruler/ruler-shared";

const WORDMARK_TEXT = "ARTCRAFT";
const WORDMARK_FONT =
  "var(--font-archivo-black), var(--font-archivo), system-ui, sans-serif";

// The poster masthead: the wordmark justified flush across the hero rails in
// the site's display type — per-letter spans instead of one text node,
// because these very spans ARE the ruler's hero heading: HeadingFlow drives
// their transforms so the resting title condenses into the top heading slot
// as the visitor scrolls out of the landing. Crawlable via role="img" +
// aria-label; z-40 so letters in transit ride above later sections (below
// the z-50 nav). The bg-colored halos keep the type legible over any spiral
// card passing beneath.
//
// Font size is derived so the word's natural advance run spans the box
// exactly. After layout, each letter's natural center and advance are
// measured and published to the shared heroWordmark channel for the ruler to
// drive; transforms are reset before measuring so a mid-morph resize
// re-baselines cleanly.
export default function HeroMasthead() {
  const boxRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [fontPx, setFontPx] = useState(0);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    let cancelled = false;

    const compute = () => {
      if (cancelled) return;
      const probe = document.createElement("span");
      probe.style.cssText =
        "position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;font-size:100px;line-height:1;";
      probe.style.fontFamily = WORDMARK_FONT;
      probe.textContent = WORDMARK_TEXT;
      document.body.appendChild(probe);
      const w100 = probe.getBoundingClientRect().width;
      probe.remove();
      const target = box.clientWidth;
      if (w100 > 0 && target > 0) {
        setFontPx(Math.round((target / w100) * 1000) / 10);
      }
    };

    const ready = document.fonts?.ready;
    if (ready) ready.then(compute).catch(compute);
    else compute();
    const ro = new ResizeObserver(compute);
    ro.observe(box);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, []);

  // Publish letter geometry once the real size is applied.
  useEffect(() => {
    if (!fontPx) return;
    const els = letterRefs.current.filter(
      (el): el is HTMLSpanElement => !!el,
    );
    if (els.length !== WORDMARK_TEXT.length) return;

    const measure = () => {
      for (const el of els) el.style.transform = "";
      const rects = els.map((el) => el.getBoundingClientRect());
      heroWordmark.els = els;
      heroWordmark.baseX = rects.map((r) => r.left + r.width / 2);
      heroWordmark.baseDocY = rects.map(
        (r) => r.top + r.height / 2 + window.scrollY,
      );
      const adv = rects.map((r) => r.width / fontPx);
      const cum: number[] = [];
      let total = 0;
      for (const a of adv) {
        cum.push(total);
        total += a;
      }
      heroWordmark.metrics = { adv, cum, total };
      heroWordmark.fontPx = fontPx;
      heroWordmark.ready = true;
    };

    measure();
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      heroWordmark.ready = false;
      heroWordmark.els = [];
    };
  }, [fontPx]);

  return (
    <div ref={boxRef} className="pointer-events-none relative z-40 w-full">
      <div
        role="img"
        aria-label={WORDMARK_TEXT}
        className="whitespace-pre text-ink-strong"
        style={{
          fontFamily: WORDMARK_FONT,
          fontSize: fontPx || "13vw",
          lineHeight: 1,
        }}
      >
        {WORDMARK_TEXT.split("").map((ch, i) => (
          <span
            key={i}
            aria-hidden
            ref={(el) => {
              letterRefs.current[i] = el;
            }}
            className="inline-block"
            style={{
              willChange: "transform, opacity",
              // Three stacked halos in the page background color: a tight
              // contact edge, a mid falloff, and a wide pool that sinks
              // the busiest footage behind the letters. Sized in vw so the
              // spread tracks the type as the wordmark scales.
              textShadow: [
                "0 0 0.6vw color-mix(in srgb, var(--bg) 92%, transparent)",
                "0 0.25vw 2.4vw color-mix(in srgb, var(--bg) 78%, transparent)",
                "0 0.4vw 5vw color-mix(in srgb, var(--bg) 55%, transparent)",
              ].join(", "),
            }}
          >
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
}
