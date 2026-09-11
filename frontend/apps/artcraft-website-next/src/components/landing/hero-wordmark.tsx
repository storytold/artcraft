"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { heroWordmark } from "@/components/ruler/ruler-shared";
import { introClock, introTuner } from "@/lib/intro";

const WORDMARK_TEXT = "ARTCRAFT";
// Variable Archivo at its poster extreme — the Archivo Black look, but on
// the same variable family as every heading, so HeadingFlow can
// interpolate weight/width down to the display setting (620 / 118%)
// during the hero flip.
const WORDMARK_FONT = "var(--font-archivo), system-ui, sans-serif";
const WORDMARK_WEIGHT = 900;
const WORDMARK_STRETCH = "125%";

// The leading A is the brand mark, not the glyph — an inline SVG in
// currentColor, so the ruler's solid-ink dimming, hover, and press states
// drive it exactly like a letter. Sized to the caps' visual height; its
// advance (width + a side-bearing pad) is measured like any letter's, so
// all downstream metrics just work. It rides the entire heading lifecycle.
const LOGO_ASPECT = 116.34 / 97.5;
const LOGO_CAP_EM = 0.73;
const LOGO_ADV_EM = LOGO_CAP_EM * LOGO_ASPECT;
const LOGO_PAD_EM = 0.05;

function LogoGlyph() {
  return (
    <svg
      viewBox="0 0 116.34 97.5"
      fill="currentColor"
      aria-hidden
      style={{
        display: "inline-block",
        width: `${LOGO_ADV_EM}em`,
        height: `${LOGO_CAP_EM}em`,
        // The letters carry a bg-colored text-shadow halo; text-shadow
        // can't touch an SVG, so the mark gets the same treatment as
        // drop-shadows.
        filter:
          "drop-shadow(0 0 0.3vw color-mix(in srgb, var(--bg) 85%, transparent)) drop-shadow(0 0.2vw 1.6vw color-mix(in srgb, var(--bg) 60%, transparent))",
      }}
    >
      <path d="M104.28,49.49L81.55,0h-31.23l-3.17,4.76L14.75,53.63,0,75.85l21.55,21.55,63.79-36.94,16.99,37.04,14.01-21.74-12.06-26.27ZM32.89,65.66l32.42-48.87,10.91,23.77-43.32,25.09Z" />
    </svg>
  );
}

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
      probe.style.fontWeight = String(WORDMARK_WEIGHT);
      probe.style.fontStretch = WORDMARK_STRETCH;
      // Letter 0 is the logo (fixed em advance), so only RTCRAFT is
      // probed; the logo's advance joins the per-px run analytically.
      probe.textContent = WORDMARK_TEXT.slice(1);
      document.body.appendChild(probe);
      const w100 = probe.getBoundingClientRect().width;
      probe.remove();
      const target = box.clientWidth;
      if (w100 > 0 && target > 0) {
        const perPx = w100 / 100 + LOGO_ADV_EM + LOGO_PAD_EM;
        setFontPx(Math.round((target / perPx) * 10) / 10);
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
      for (const el of els) {
        // Reset transforms AND the variable-font morph to the resting cut
        // before measuring, so a mid-flip resize re-baselines cleanly.
        el.style.transform = "";
        el.style.fontWeight = "";
        el.style.fontStretch = "";
        el.style.width = "";
      }
      const rects = els.map((el) => el.getBoundingClientRect());
      // Pin each letter to its resting advance width: the flip morphs
      // font-weight per frame, and on inline spans that would REFLOW the
      // word — every base-relative transform downstream assumes the
      // measured layout. With widths pinned, lighter glyphs simply center
      // in their boxes and flow never moves.
      els.forEach((el, i) => {
        el.style.width = `${rects[i].width}px`;
      });
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

  // Intro formation: the logo alone at the word's center, the letters
  // sliding out from behind it while the logo glides to its slot — the
  // assembly stays continuously centered. Owned HERE (not by HeadingFlow)
  // so the formation plays on every device, ruler or not; the `forming`
  // flag keeps HeadingFlow's per-frame hero writes off until it completes.
  useEffect(() => {
    if (!fontPx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const it0 = introTuner.read();
    const total =
      it0.wordAt + it0.wordDur + WORDMARK_TEXT.length * it0.wordStagger + 0.5;
    if (introClock.t > total) return;
    const els = letterRefs.current.filter((el): el is HTMLSpanElement => !!el);
    if (els.length !== WORDMARK_TEXT.length) return;

    heroWordmark.forming = true;
    for (let i = 1; i < els.length; i++) els[i].style.opacity = "0";
    els[0].style.opacity = "0";

    const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
    const easeInOut = (x: number) =>
      x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

    const tick = () => {
      if (!heroWordmark.ready) return;
      const it = introTuner.read();
      const t = introClock.t;
      const bx = heroWordmark.baseX;
      const adv = heroWordmark.metrics.adv;
      const F = heroWordmark.fontPx;
      const n = els.length;
      const left = bx[0] - (adv[0] * F) / 2;
      const right = bx[n - 1] + (adv[n - 1] * F) / 2;
      const center = (left + right) / 2;

      const fLogo = easeInOut(
        clamp01((t - it.wordAt) / Math.max(0.1, it.wordDur)),
      );
      els[0].style.transform = `translate3d(${((center - bx[0]) * (1 - fLogo)).toFixed(1)}px, 0, 0)`;
      els[0].style.opacity = String(clamp01(t / 0.3));

      let done = fLogo >= 1 && t > 0.35;
      const letterDur = Math.max(0.2, it.wordDur * 0.55);
      for (let i = 1; i < n; i++) {
        const fi = clamp01((t - it.wordAt - i * it.wordStagger) / letterDur);
        const e = easeOut(fi);
        els[i].style.transform = `translate3d(${((center - bx[i]) * (1 - e)).toFixed(1)}px, 0, 0)`;
        els[i].style.opacity = String(clamp01(fi * 2.5));
        if (fi < 1) done = false;
      }
      if (done) {
        for (const el of els) {
          el.style.transform = "";
          el.style.opacity = "";
        }
        heroWordmark.forming = false;
        gsap.ticker.remove(tick);
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      heroWordmark.forming = false;
      for (const el of letterRefs.current) {
        if (el) {
          el.style.transform = "";
          el.style.opacity = "";
        }
      }
    };
  }, [fontPx]);

  return (
    <div ref={boxRef} className="pointer-events-none relative z-40 w-full">
      {/* Focus pocket: a feathered backdrop blur over the wordmark's
          bounding box (plus breathing room), so the nebula's newborn cards
          soften further right where the type sits — the mark always floats
          above the swirl. */}
      <div
        aria-hidden
        className="absolute -inset-x-[6%] -inset-y-[34%]"
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          maskImage:
            "radial-gradient(closest-side, black 45%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(closest-side, black 45%, transparent 100%)",
        }}
      />
      <div
        role="img"
        aria-label={WORDMARK_TEXT}
        className="relative whitespace-pre text-ink-strong"
        style={{
          fontFamily: WORDMARK_FONT,
          fontWeight: WORDMARK_WEIGHT,
          fontStretch: WORDMARK_STRETCH,
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
            className="inline-block text-center"
            style={{
              ...(i === 0 ? { paddingRight: `${LOGO_PAD_EM}em` } : null),
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
            {i === 0 ? <LogoGlyph /> : ch}
          </span>
        ))}
      </div>
    </div>
  );
}
