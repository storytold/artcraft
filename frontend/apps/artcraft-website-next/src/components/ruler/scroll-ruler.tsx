"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { HERO_SECTION_ID, RULER_SECTIONS } from "@/lib/landing-data";
import { lenisRef } from "@/lib/lenis-ref";
import { useTunerStore } from "@/lib/tuner";
import HeadingFlow from "./heading-flow";
import {
  NAV_H,
  clamp01,
  easeOutExpo,
  type MeasuredSection,
  type RulerMode,
  type RulerSide,
} from "./ruler-shared";
import {
  rulerLayoutTuner,
  rulerLookTuner,
  rulerMotionTuner,
} from "./ruler-tunables";

// The scroll ruler: a vertical instrument replacing the native scrollbar.
//
// The tick track is 1:1 with the document (tick p% sits at p% of the page)
// and translates with scroll. The needle travels the viewport like a
// scrollbar thumb — at progress p it sits p of the way down AND points
// exactly at the tick labeled p, because the track carries a small
// scroll-dependent offset (NAV_H·(1−p)) that reconciles the two mappings.
// So ticks, needle, readout, and click targets always agree.
//
// Clicking the rail jumps to that progress (native-scrollbar semantics, via
// Lenis so the jump is damped); the hover ghost previews the destination.
// Section headings live in HeadingFlow: queued at the bottom (the navbar),
// riding the track as vertical words, flipping horizontal into the top
// stack. See DESIGN.md for the ideology this serves.
//
// Progressive enhancement: fine pointers on md+ get the full instrument
// (native scrollbar hidden); reduced-motion visitors get a static rail and
// keep their scrollbar; coarse pointers and small screens get nothing.
export default function ScrollRuler() {
  const [mode, setMode] = useState<RulerMode | null>(null);
  const [geom, setGeom] = useState({ docH: 0, vh: 0, vw: 0 });
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [sections, setSections] = useState<MeasuredSection[]>([]);

  const railRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const ghostLineRef = useRef<HTMLDivElement>(null);
  const ghostLabelRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const digitRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Mutable per-frame state, never triggering React.
  const fs = useRef({
    vel: 0,
    lastY: 0,
    introDone: false,
    prevDigits: [-1, -1, -1],
    prevPct: -1,
    readoutAbove: false,
    sections: [] as MeasuredSection[],
    geom: { docH: 0, vh: 0, vw: 0 },
  });
  fs.current.sections = sections;
  fs.current.geom = geom;

  // Capability gate. Media changes mid-session are rare enough that a
  // reload is the supported way to re-evaluate.
  useEffect(() => {
    const fine = window.matchMedia(
      "(pointer: fine) and (min-width: 768px)",
    ).matches;
    if (!fine) return;
    const motionOk = window.matchMedia(
      "(prefers-reduced-motion: no-preference)",
    ).matches;
    setMode(motionOk ? "full" : "static");
  }, []);

  // Structural tunables (layout + look) rebuild the rendered rail —
  // debounced, same pattern as the hero wall.
  useEffect(() => {
    const snapshot = () =>
      JSON.stringify([rulerLayoutTuner.read(), rulerLookTuner.read()]);
    let last = snapshot();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useTunerStore.subscribe(() => {
      const now = snapshot();
      if (now === last) return;
      last = now;
      clearTimeout(timer);
      timer = setTimeout(() => setLayoutVersion((v) => v + 1), 250);
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const layout = useMemo(
    () => rulerLayoutTuner.read(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layoutVersion, mode],
  );
  const look = useMemo(
    () => rulerLookTuner.read(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layoutVersion, mode],
  );
  const side: RulerSide = layout.side >= 0.5 ? "right" : "left";
  const railW = layout.railW;

  // Stamp the mode on <html> so CSS can hide the scrollbar and reserve the
  // rail gutter (JS-gated: no-JS visitors keep their scrollbar).
  useEffect(() => {
    if (!mode) return;
    const root = document.documentElement;
    root.dataset.ruler = mode === "full" ? "on" : "static";
    root.dataset.rulerSide = side;
    root.style.setProperty("--ruler-rail", `${railW}px`);
    return () => {
      delete root.dataset.ruler;
      delete root.dataset.rulerSide;
      root.style.removeProperty("--ruler-rail");
    };
  }, [mode, side, railW]);

  // Page geometry. Guarded set: ResizeObserver fires on every body change
  // and most of them don't move the numbers.
  useEffect(() => {
    if (!mode) return;
    const measure = () => {
      const next = {
        docH: document.documentElement.scrollHeight,
        vh: window.innerHeight,
        vw: window.innerWidth,
      };
      setGeom((prev) =>
        prev.docH === next.docH && prev.vh === next.vh && prev.vw === next.vw
          ? prev
          : next,
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [mode]);

  // Section anchors, resolved against the live DOM.
  useEffect(() => {
    if (!mode || !geom.docH) return;
    const { heroOffset } = rulerLayoutTuner.read();
    const out: MeasuredSection[] = [];
    for (const s of RULER_SECTIONS) {
      const el = document.getElementById(s.id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const isHero = s.id === HERO_SECTION_ID;
      const anchor = isHero
        ? rect.bottom + window.scrollY - heroOffset
        : rect.top + window.scrollY;
      out.push({ id: s.id, label: s.label, index: out.length, anchor, isHero });
    }
    setSections(out);
  }, [mode, geom, layoutVersion]);

  // Tick roster: minor every `minorPct`, labeled major every `labelPct`.
  const ticks = useMemo(() => {
    if (!mode || !geom.docH) return [];
    const out: { pct: number; docY: number; major: boolean; alpha: number }[] =
      [];
    for (let p = 0; p <= 100 + 1e-6; p += layout.minorPct) {
      const pct = Math.round(p * 100) / 100;
      const major = Math.abs(pct % layout.labelPct) < 1e-6;
      out.push({
        pct,
        docY: (pct / 100) * geom.docH,
        major,
        alpha: major ? look.majorAlpha : look.minorAlpha,
      });
    }
    lineRefs.current.length = out.length;
    return out;
  }, [mode, geom.docH, layout, look]);

  // Intro cascade: ticks draw in from the outer edge, top-down, then the
  // per-frame velocity writer takes over.
  useEffect(() => {
    if (mode !== "full" || !ticks.length) return;
    const els = lineRefs.current.filter((el): el is HTMLSpanElement => !!el);
    if (!els.length) return;
    const mt = rulerMotionTuner.read();
    fs.current.introDone = false;
    const tween = gsap.fromTo(
      els,
      { scaleX: 0, opacity: 0 },
      {
        scaleX: 1,
        opacity: (i: number) => ticks[i]?.alpha ?? 0.3,
        duration: mt.introDur,
        stagger: mt.introStagger,
        ease: "power3.out",
        overwrite: true,
        onComplete: () => {
          fs.current.introDone = true;
        },
      },
    );
    let needleTween: gsap.core.Tween | undefined;
    if (needleRef.current) {
      needleTween = gsap.fromTo(
        needleRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, delay: mt.introDur * 0.5 },
      );
    }
    return () => {
      tween.kill();
      needleTween?.kill();
      fs.current.introDone = true;
    };
  }, [mode, ticks]);

  // Frame loop: track sync, needle travel, odometer, velocity stretch.
  useEffect(() => {
    if (!mode || !geom.docH) return;
    const full = mode === "full";
    const tick = (_time: number, deltaMs: number) => {
      const st = fs.current;
      const { docH, vh } = st.geom;
      if (!vh) return;
      const dt = Math.min(deltaMs / 1000, 0.1) || 0.016;
      const scrollY = window.scrollY;
      const maxScroll = Math.max(1, docH - vh);
      const progress = clamp01(scrollY / maxScroll);

      const raw = (scrollY - st.lastY) / dt;
      st.lastY = scrollY;
      st.vel += (raw - st.vel) * (1 - Math.exp(-6 * dt));

      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(0, ${
          -scrollY + NAV_H * (1 - progress)
        }px, 0)`;
      }

      const ny = NAV_H + progress * (vh - NAV_H);
      if (needleRef.current) {
        needleRef.current.style.transform = `translate3d(0, ${ny}px, 0)`;
      }
      const above = ny > vh - 26;
      if (readoutRef.current && above !== st.readoutAbove) {
        st.readoutAbove = above;
        readoutRef.current.style.top = above ? "-14px" : "4px";
      }

      const pct = Math.round(progress * 100);
      if (pct !== st.prevPct) {
        st.prevPct = pct;
        railRef.current?.setAttribute("aria-valuenow", String(pct));
        const str = String(pct).padStart(3, "0");
        for (let c = 0; c < 3; c++) {
          const d = str.charCodeAt(c) - 48;
          if (d !== st.prevDigits[c]) {
            st.prevDigits[c] = d;
            const col = digitRefs.current[c];
            if (col) col.style.transform = `translateY(${-d}em)`;
          }
        }
      }

      // Velocity response: ticks near the needle stretch with scroll speed.
      if (full && st.introDone && ticks.length) {
        const mt = rulerMotionTuner.read();
        const needleDocY = progress * docH;
        const velNorm = clamp01(Math.abs(st.vel) / 3000);
        for (let i = 0; i < ticks.length; i++) {
          const el = lineRefs.current[i];
          if (!el) continue;
          const dist = Math.abs(ticks[i].docY - needleDocY);
          if (dist < mt.velRadius && mt.velRadius > 0) {
            const t = 1 - dist / mt.velRadius;
            const boost = velNorm * t * t;
            el.style.transform = `scaleX(${1 + mt.velMax * boost})`;
            el.style.opacity = String(
              Math.min(1, ticks[i].alpha + 0.6 * boost),
            );
          } else {
            el.style.transform = "scaleX(1)";
            el.style.opacity = String(ticks[i].alpha);
          }
        }
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, [mode, geom, ticks]);

  if (!mode || !geom.docH) return null;

  const sideStyle =
    side === "right" ? { right: 0 as const } : { left: 0 as const };
  const outerProp = side === "right" ? "right" : "left";

  const railClick = (e: React.MouseEvent) => {
    const st = fs.current;
    const p = clamp01((e.clientY - NAV_H) / Math.max(1, st.geom.vh - NAV_H));
    const target = p * Math.max(1, st.geom.docH - st.geom.vh);
    const lenis = lenisRef.current;
    if (lenis) {
      const mt = rulerMotionTuner.read();
      const dist = Math.abs(target - window.scrollY);
      lenis.scrollTo(target, {
        duration:
          mt.jumpDur * (0.4 + 0.6 * Math.min(1, dist / (st.geom.vh * 2.5))),
        easing: easeOutExpo,
      });
    } else {
      window.scrollTo({ top: target });
    }
    if (mode === "full" && ghostLineRef.current) {
      gsap.fromTo(
        ghostLineRef.current,
        { opacity: 1 },
        { opacity: rulerLookTuner.read().ghostAlpha, duration: 0.45 },
      );
    }
  };

  const railMove = (e: React.MouseEvent) => {
    const st = fs.current;
    const ghost = ghostRef.current;
    if (!ghost) return;
    const y = Math.max(NAV_H, Math.min(st.geom.vh, e.clientY));
    const p = clamp01((y - NAV_H) / Math.max(1, st.geom.vh - NAV_H));
    ghost.style.opacity = "1";
    ghost.style.transform = `translate3d(0, ${y}px, 0)`;
    if (ghostLabelRef.current) {
      const pct = Math.round(p * 100);
      const docY = p * st.geom.docH;
      let label = `${pct}`;
      for (const s of st.sections) {
        if (s.anchor <= docY) label = `${pct} — ${s.label}`;
      }
      ghostLabelRef.current.textContent = label;
    }
  };

  const railLeave = () => {
    if (ghostRef.current) ghostRef.current.style.opacity = "0";
  };

  return (
    <>
      {/* The rail: interactive scrollbar strip at the viewport edge. */}
      <div
        ref={railRef}
        role="scrollbar"
        aria-controls="main"
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        aria-label="Page position"
        className="fixed inset-y-0 z-40 cursor-crosshair overflow-hidden"
        style={{ ...sideStyle, width: railW }}
        onClick={railClick}
        onMouseMove={mode === "full" ? railMove : undefined}
        onMouseLeave={mode === "full" ? railLeave : undefined}
      >
        {/* Tick track — 1:1 with the document, translated per frame. */}
        <div
          ref={trackRef}
          aria-hidden
          className="absolute inset-x-0 top-0"
          style={{ height: geom.docH }}
        >
          {ticks.map((t, i) => (
            <div
              key={t.pct}
              className="absolute inset-x-0"
              style={{ top: t.docY, height: 0 }}
            >
              <span
                ref={(el) => {
                  lineRefs.current[i] = el;
                }}
                className="absolute block bg-ink"
                style={{
                  [outerProp]: 0,
                  top: 0,
                  width: t.major ? look.majorLen : look.minorLen,
                  height: 1,
                  opacity: mode === "full" ? 0 : t.alpha,
                  transformOrigin: `${outerProp} center`,
                }}
              />
              {t.major && (
                <span
                  className="absolute -translate-y-1/2 font-mono text-ink"
                  style={{
                    [outerProp]: look.majorLen + 4,
                    top: 0,
                    fontSize: 9,
                    letterSpacing: "0.08em",
                    opacity: look.labelAlpha,
                  }}
                >
                  {t.pct}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Needle: travels [NAV_H, vh] with progress, meeting its tick. */}
        <div
          ref={needleRef}
          aria-hidden
          className="absolute inset-x-0 top-0"
          style={{ height: 0 }}
        >
          <span
            className="absolute inset-x-0 block bg-accent"
            style={{ top: 0, height: 1, boxShadow: "0 0 6px var(--accent)" }}
          />
          <span
            ref={readoutRef}
            className="absolute whitespace-nowrap font-mono text-accent-ink"
            style={{
              [outerProp]: 2,
              top: 4,
              fontSize: 9,
              letterSpacing: "0.08em",
            }}
          >
            <span className="ruler-digits">
              {[0, 1, 2].map((c) => (
                <span
                  key={c}
                  ref={(el) => {
                    digitRefs.current[c] = el;
                  }}
                  className="ruler-digit-col"
                >
                  {"0123456789".split("").map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </span>
              ))}
            </span>
            <span style={{ marginLeft: 2 }}>%</span>
          </span>
        </div>
      </div>

      {/* Hover ghost — destination preview, outside the rail so its label
          can extend inward past the ticks. */}
      {mode === "full" && (
        <div
          ref={ghostRef}
          aria-hidden
          className="pointer-events-none fixed inset-y-0 z-40"
          style={{
            ...sideStyle,
            width: railW,
            height: 0,
            opacity: 0,
            top: 0,
          }}
        >
          <div
            ref={ghostLineRef}
            className="absolute block bg-ink"
            style={{
              [outerProp]: 0,
              top: 0,
              width: railW,
              height: 1,
              opacity: look.ghostAlpha,
            }}
          />
          <div
            ref={ghostLabelRef}
            className="absolute -translate-y-1/2 whitespace-nowrap bg-invert-bg px-1.5 py-0.5 font-mono text-invert-fg"
            style={{
              [outerProp]: railW + 6,
              top: 0,
              fontSize: 9,
              letterSpacing: "0.08em",
            }}
          />
        </div>
      )}

      <HeadingFlow
        mode={mode}
        side={side}
        sections={sections}
        geom={geom}
        layoutVersion={layoutVersion}
      />
    </>
  );
}
