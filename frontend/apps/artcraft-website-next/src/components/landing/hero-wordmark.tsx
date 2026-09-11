"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { heroWordmark } from "@/components/ruler/ruler-shared";
import { introClock, introTuner, onIntroReplay } from "@/lib/intro";
import { defineTunables, useTunerStore } from "@/lib/tuner";

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
// drive it exactly like a letter. Its advance (width + a side-bearing pad)
// is measured like any letter's, so all downstream metrics just work, and
// it rides the entire heading lifecycle.
const LOGO_ASPECT = 116.34 / 97.5;

// The logo's optical fit against the glyphs is dialed by eye: the browser
// aligns an inline SVG's BOX bottom to the text baseline, but glyph ink is
// placed from font metrics (baseline overshoot, cap forms sitting a hair
// off the geometric lines in heavy masters) — there is no CSS auto-sync
// between SVG geometry and type ink, so cap height, baseline lift, and
// side bearing are live knobs to tune and bake.
const wordmarkTuner = defineTunables("wordmark", "Wordmark", {
  logoCap: {
    label: "Logo cap em",
    min: 0.5,
    max: 1,
    step: 0.005,
    default: 0.7,
    info: "Height of the logo-A relative to the font size — match it to the caps' visual height.",
  },
  logoLift: {
    label: "Logo lift em",
    min: -0.1,
    max: 0.1,
    step: 0.002,
    default: -0.006,
    info: "Vertical baseline correction of the logo-A: positive raises it. Syncs the SVG's box-bottom alignment with the glyphs' ink baseline.",
  },
  logoPad: {
    label: "Logo pad em",
    min: 0,
    max: 0.15,
    step: 0.005,
    default: 0.05,
    info: "Side bearing between the logo-A and the R, standing in for the glyph spacing the SVG doesn't have.",
  },
  bladeTuck: {
    label: "Blade tuck em",
    min: 0,
    max: 0.5,
    step: 0.01,
    default: 0.12,
    info: "Extra distance the sliding word starts tucked behind the blade edge — kills any sliver peeking past the clip at rest.",
  },
  scrimPadX: {
    label: "Scrim pad x",
    min: 0,
    max: 320,
    step: 8,
    default: 128,
    info: "How far the contrast scrim behind the center stack extends horizontally beyond the content.",
  },
  scrimPadY: {
    label: "Scrim pad y",
    min: 0,
    max: 240,
    step: 8,
    default: 88,
    info: "How far the contrast scrim extends vertically beyond the content.",
  },
  scrimBg: {
    label: "Scrim peak %",
    min: 40,
    max: 95,
    step: 1,
    default: 78,
    info: "Peak page-background strength at the scrim's center — the contrast pocket the wordmark and copy sit in over the galaxy.",
  },
});

function wordmarkDefaults(): { [K in keyof typeof wordmarkTuner.defs]: number } {
  const out = {} as { [K in keyof typeof wordmarkTuner.defs]: number };
  for (const key of Object.keys(wordmarkTuner.defs) as Array<
    keyof typeof wordmarkTuner.defs
  >) {
    out[key] = wordmarkTuner.defs[key].default;
  }
  return out;
}

// The contrast pocket behind the center stack — a radial page-bg gradient
// over the galaxy, live-tunable (pads + peak strength) in the Wordmark
// tuner group.
export function HeroScrim() {
  const [tv, setTv] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const apply = () => setTv(useTunerStore.getState().version);
    apply();
    const unsub = useTunerStore.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(apply, 150);
    });
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  // Choreography: the scrim's job is contrast AGAINST the canvas, so it
  // fades up with the galaxy's arrival (the cards beat) instead of
  // sitting there from frame zero. Clock-driven, so fast-forward and the
  // tuner replay handle themselves; reduced motion keeps it settled.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tick = () => {
      const iv = introTuner.read();
      const k = Math.max(
        0,
        Math.min(1, (introClock.t - iv.cardsAt) / 0.9),
      );
      if (ref.current) ref.current.style.opacity = String(k);
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      if (ref.current) ref.current.style.opacity = "";
    };
  }, []);

  const wm = tv < 0 ? wordmarkDefaults() : wordmarkTuner.read();
  return (
    <div
      ref={ref}
      aria-hidden
      className="absolute"
      style={{
        inset: `-${wm.scrimPadY}px -${wm.scrimPadX}px`,
        background: `radial-gradient(closest-side, color-mix(in srgb, var(--bg) ${wm.scrimBg}%, transparent), transparent)`,
      }}
    />
  );
}

function LogoGlyph({ cap, lift }: { cap: number; lift: number }) {
  return (
    <svg
      viewBox="0 0 116.34 97.5"
      fill="currentColor"
      aria-hidden
      style={{
        display: "inline-block",
        width: `${cap * LOGO_ASPECT}em`,
        height: `${cap}em`,
        verticalAlign: `${lift}em`,
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

  // Live wordmark optics: -1 = SSR/hydration render (registered defaults)
  // so server and client agree; tuner overrides apply after mount. The
  // logo's advance feeds the fontPx derivation, so sizing follows knobs.
  const [tv, setTv] = useState(-1);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const apply = () => setTv(useTunerStore.getState().version);
    apply();
    const unsub = useTunerStore.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(apply, 150);
    });
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);
  const wm = tv < 0 ? wordmarkDefaults() : wordmarkTuner.read();
  const wmRef = useRef(wm);
  wmRef.current = wm;

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
        const perPx = w100 / 100 + wm.logoCap * LOGO_ASPECT + wm.logoPad;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tv]);

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
    const els = letterRefs.current.filter((el): el is HTMLSpanElement => !!el);
    if (els.length !== WORDMARK_TEXT.length) return;

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
      const logoCx = bx[0] + (center - bx[0]) * (1 - fLogo);
      els[0].style.transform = `translate3d(${(logoCx - bx[0]).toFixed(1)}px, 0, 0)`;
      els[0].style.opacity = String(clamp01(t / 0.3));
      // The blade edge: everything left of the logo's live right edge is
      // clipped away.
      const logoRight = logoCx + (adv[0] * F) / 2;

      // The word is ONE sliding surface: a single shared offset animates
      // to zero, so the letters never move relative to each other. It
      // starts far enough left that the whole block (plus a tunable tuck)
      // hides behind the blade edge, and emerges through it as it slides.
      const wordRight = bx[n - 1] + (adv[n - 1] * F) / 2;
      const o0 =
        -(wordRight - (bx[0] + (adv[0] * F) / 2)) -
        wmRef.current.bladeTuck * F;
      const f = clamp01((t - it.wordAt) / Math.max(0.1, it.wordDur));
      const o = o0 * (1 - easeOut(f));

      let done = fLogo >= 1 && f >= 1 && t > 0.35;
      for (let i = 1; i < n; i++) {
        const x = bx[i] + o;
        els[i].style.transform = `translate3d(${o.toFixed(1)}px, 0, 0)`;
        els[i].style.opacity = "1";
        const clipL = logoRight - (x - (adv[i] * F) / 2);
        els[i].style.clipPath =
          clipL > 0.5 ? `inset(-20% 0 -20% ${clipL.toFixed(1)}px)` : "";
      }
      if (done) {
        for (const el of els) {
          el.style.transform = "";
          el.style.opacity = "";
          el.style.clipPath = "";
        }
        heroWordmark.forming = false;
        gsap.ticker.remove(tick);
      }
    };

    // Runs at mount when the intro is still ahead, and again on the
    // tuner's debug replay (the clock is already rewound by then).
    const start = () => {
      const it0 = introTuner.read();
      const total = it0.wordAt + it0.wordDur + 0.5;
      if (introClock.t > total) return;
      gsap.ticker.remove(tick);
      heroWordmark.forming = true;
      for (const el of els) el.style.opacity = "0";
      gsap.ticker.add(tick);
    };
    start();
    const offReplay = onIntroReplay(start);
    return () => {
      offReplay();
      gsap.ticker.remove(tick);
      heroWordmark.forming = false;
      for (const el of letterRefs.current) {
        if (el) {
          el.style.transform = "";
          el.style.opacity = "";
          el.style.clipPath = "";
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
              ...(i === 0 ? { paddingRight: `${wm.logoPad}em` } : null),
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
            {i === 0 ? <LogoGlyph cap={wm.logoCap} lift={wm.logoLift} /> : ch}
          </span>
        ))}
      </div>
    </div>
  );
}
