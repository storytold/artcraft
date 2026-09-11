"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { HERO_SECTION_ID, RULER_SECTIONS } from "@/lib/landing-data";
import { introClock, introTuner, onIntroFast } from "@/lib/intro";
import { lenisRef } from "@/lib/lenis-ref";
import { useTunerStore } from "@/lib/tuner";
import HeadingFlow from "./heading-flow";
import {
  NAV_H,
  clamp01,
  easeOutExpo,
  railOccupancy,
  rulerMap,
  rulerZoom,
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
  const bracketRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tickRowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const digitRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Mutable per-frame state, never triggering React.
  const fs = useRef({
    vel: 0,
    lastY: 0,
    introDone: false,
    prevDigits: [-1, -1, -1],
    prevPct: -1,
    readoutAbove: false,
    geom: { docH: 0, vh: 0, vw: 0 },
    zoomIntent: false,
    zoomTimer: 0,
    zoomWrote: false,
    ghostActive: false,
    ghostY: 0,
    dragStartY: 0,
    dragMoved: 0,
  });
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

  // Reset the shared zoom state (and its pending intent timer) on unmount
  // so a remount never inherits a half-engaged zoom.
  useEffect(() => {
    const st = fs.current;
    return () => {
      window.clearTimeout(st.zoomTimer);
      rulerZoom.target = 0;
      rulerZoom.p = 0;
      rulerZoom.dragging = false;
    };
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

  // Section anchors, resolved against the live DOM. (The hero's anchor is
  // unused for motion — its morph is driven by the wordmark's own position
  // in heading-flow — but measured uniformly anyway.)
  useEffect(() => {
    if (!mode || !geom.docH) return;
    const out: MeasuredSection[] = [];
    for (const s of RULER_SECTIONS) {
      const el = document.getElementById(s.id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const isHero = s.id === HERO_SECTION_ID;
      const anchor = rect.top + window.scrollY;
      out.push({
        id: s.id,
        label: s.label,
        index: out.length,
        anchor,
        bottom: rect.bottom + window.scrollY,
        isHero,
      });
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
    tickRowRefs.current.length = out.length;
    labelRefs.current.length = out.length;
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
    // The cascade waits for the master intro's instrument beat (a lead-in
    // tween carries the delay so timeScale accelerates it too), hidden
    // from the first frame so nothing shows during the wait. Fast-forward
    // input accelerates the whole timeline.
    const it = introTuner.read();
    gsap.set(els, { scaleX: 0, opacity: 0 });
    const tl = gsap.timeline();
    tl.to({}, { duration: it.instrAt });
    tl.to(els, {
      scaleX: 1,
      opacity: (i: number) => ticks[i]?.alpha ?? 0.3,
      duration: mt.introDur,
      stagger: mt.introStagger,
      ease: "power3.out",
      overwrite: true,
      onComplete: () => {
        fs.current.introDone = true;
      },
    });
    tl.timeScale(introClock.scale);
    const offFast = onIntroFast(() =>
      tl.timeScale(introTuner.read().ffScale),
    );
    // No intro tween for the needle: its opacity is owned per-frame by the
    // sub-N% progress fade (hidden at page top anyway).
    return () => {
      offFast();
      tl.kill();
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

      const map = rulerMap(vh, rulerLayoutTuner.read().edgePad);
      const drift = map.drift(progress);
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(0, ${
          -scrollY + drift
        }px, 0)`;
      }

      const lk = rulerLookTuner.read();
      const ny = map.base + progress * map.span;
      if (needleRef.current) {
        needleRef.current.style.transform = `translate3d(0, ${ny}px, 0)`;
        // Quiet at the very top: the needle (and readout) fade in over the
        // first few percent of progress instead of overlapping the hero.
        needleRef.current.style.opacity = String(
          clamp01(progress / Math.max(0.001, lk.needleFadePct / 100)),
        );
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

      // Zoom morph: hover intent (or an active drag) compresses the
      // document-scale ruler onto the stationary needle — the needle's
      // travel position IS tick p's compact position, so it never moves.
      const mt = rulerMotionTuner.read();
      if (full) {
        rulerZoom.target = st.zoomIntent || rulerZoom.dragging ? 1 : 0;
        rulerZoom.p +=
          (rulerZoom.target - rulerZoom.p) * (1 - Math.exp(-mt.zoomLerp * dt));
        if (rulerZoom.target === 0 && rulerZoom.p < 0.0005) rulerZoom.p = 0;
        if (rulerZoom.target === 1 && rulerZoom.p > 0.9995) rulerZoom.p = 1;
      }
      const z = full ? rulerZoom.p : 0;

      // Visible-span bracket, only meaningful in map space.
      if (bracketRef.current) {
        const b = bracketRef.current;
        b.style.transform = `translate3d(0, ${
          map.base + (scrollY / docH) * map.span
        }px, 0)`;
        b.style.height = `${(vh / docH) * map.span}px`;
        b.style.opacity = String(z);
      }

      // Ghost follows the cursor; faint in 1:1 (its numbers are map-space),
      // full strength once the map has formed.
      if (ghostRef.current) {
        const g = ghostRef.current;
        if (st.ghostActive) {
          g.style.transform = `translate3d(0, ${st.ghostY}px, 0)`;
          g.style.opacity = String(lk.ghostAlpha * (0.2 + 0.8 * z));
        } else {
          g.style.opacity = "0";
        }
      }

      // Tick layout + velocity response in one pass: each tick blends from
      // its live 1:1 position toward its compact map position by z, and
      // ticks near the needle stretch with scroll speed.
      if (full && st.introDone && ticks.length) {
        const needleDocY = progress * docH;
        const velNorm = clamp01(Math.abs(st.vel) / 3000);
        const writeZoom = z > 0 || st.zoomWrote;
        const spans = railOccupancy.spans;
        for (let i = 0; i < ticks.length; i++) {
          const liveY = ticks[i].docY - scrollY + drift;
          const compactY = map.base + (ticks[i].pct / 100) * map.span;
          if (writeZoom) {
            const row = tickRowRefs.current[i];
            if (row) {
              row.style.transform =
                z > 0
                  ? `translate3d(0, ${z * (compactY - liveY)}px, 0)`
                  : "";
            }
          }

          // Proximity yield: percent labels fade under a passing word and
          // recover behind it. Fully zoomed, words leave the rail, so the
          // yield eases out with z.
          const lab = labelRefs.current[i];
          if (lab) {
            const y = liveY + z * (compactY - liveY);
            let fade = 1;
            if (lk.yieldPad > 0 && z < 1) {
              for (const spn of spans) {
                const d =
                  y < spn.top
                    ? spn.top - y
                    : y > spn.bottom
                      ? y - spn.bottom
                      : 0;
                if (d < lk.yieldPad) {
                  // Distance-graded, scaled by the span's on-rail strength
                  // so the yield ramps with the word's own transitions.
                  const f = 1 - spn.k * (1 - d / lk.yieldPad);
                  if (f < fade) fade = f;
                }
              }
            }
            lab.style.opacity = String(
              lk.labelAlpha * (1 - (1 - fade) * (1 - z)),
            );
          }

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
        st.zoomWrote = z > 0;
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

  // Hover intent: the zoom engages/relaxes after a short beat so grazing
  // the viewport edge doesn't fire it.
  const scheduleZoom = (on: boolean) => {
    const st = fs.current;
    window.clearTimeout(st.zoomTimer);
    const mt = rulerMotionTuner.read();
    st.zoomTimer = window.setTimeout(
      () => {
        st.zoomIntent = on;
      },
      on ? mt.zoomInDelay : mt.zoomOutDelay,
    );
  };

  const jumpTo = (clientY: number) => {
    const st = fs.current;
    const map = rulerMap(st.geom.vh, rulerLayoutTuner.read().edgePad);
    const p = clamp01((clientY - map.base) / map.span);
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
  };

  const railClick = (e: React.MouseEvent) => {
    if (fs.current.dragMoved > 4) return; // that was a drag, not a click
    jumpTo(e.clientY);
    if (mode === "full" && ghostLineRef.current) {
      gsap.fromTo(
        ghostLineRef.current,
        { opacity: 1 },
        { opacity: rulerLookTuner.read().ghostAlpha, duration: 0.45 },
      );
    }
  };

  const railPointerEnter = () => {
    scheduleZoom(true);
  };

  const railPointerLeave = () => {
    fs.current.ghostActive = false;
    if (!rulerZoom.dragging) scheduleZoom(false);
  };

  const railPointerMove = (e: React.PointerEvent) => {
    const st = fs.current;
    const map = rulerMap(st.geom.vh, rulerLayoutTuner.read().edgePad);
    const y = Math.max(map.base, Math.min(map.base + map.span, e.clientY));
    const p = clamp01((y - map.base) / map.span);
    st.ghostActive = true;
    st.ghostY = y;
    // Absolute thumb drag: the page chases the cursor through Lenis's
    // damping; release stops (no momentum).
    if (rulerZoom.dragging) {
      st.dragMoved = Math.max(
        st.dragMoved,
        Math.abs(e.clientY - st.dragStartY),
      );
      lenisRef.current?.scrollTo(
        p * Math.max(1, st.geom.docH - st.geom.vh),
        { lerp: rulerMotionTuner.read().dragLerp },
      );
    }
  };

  const railPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const st = fs.current;
    st.dragStartY = e.clientY;
    st.dragMoved = 0;
    rulerZoom.dragging = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const railPointerUp = (e: React.PointerEvent) => {
    if (!rulerZoom.dragging) return;
    rulerZoom.dragging = false;
    // Capture suppressed enter/leave while dragging — if the pointer let
    // go outside the rail, relax the zoom ourselves.
    const rect = railRef.current?.getBoundingClientRect();
    const inside =
      !!rect &&
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (!inside) {
      fs.current.ghostActive = false;
      scheduleZoom(false);
    }
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
        onPointerEnter={mode === "full" ? railPointerEnter : undefined}
        onPointerLeave={mode === "full" ? railPointerLeave : undefined}
        onPointerMove={mode === "full" ? railPointerMove : undefined}
        onPointerDown={mode === "full" ? railPointerDown : undefined}
        onPointerUp={mode === "full" ? railPointerUp : undefined}
        onPointerCancel={mode === "full" ? railPointerUp : undefined}
      >
        {/* Frost underlay: content flows under the rail (no reserved
            gutter); this pane blurs and tints whatever passes beneath so
            the instrumentation always reads. The inner feather follows a
            tunable power curve easing in toward the outer edge, so no seam
            reads while letters fly in and out. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backdropFilter: "blur(9px)",
            WebkitBackdropFilter: "blur(9px)",
            backgroundColor: "color-mix(in srgb, var(--bg) 55%, transparent)",
            maskImage: frostMask(side, look.frostSolid, look.frostGamma),
            WebkitMaskImage: frostMask(side, look.frostSolid, look.frostGamma),
          }}
        />

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
              ref={(el) => {
                tickRowRefs.current[i] = el;
              }}
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
                  ref={(el) => {
                    labelRefs.current[i] = el;
                  }}
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

        {/* Visible-span bracket: the current viewport's slice of the page,
            shown only while the zoomed map is formed. */}
        {mode === "full" && (
          <div
            ref={bracketRef}
            aria-hidden
            className="absolute inset-x-0 top-0"
            style={{ height: 0, opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-ink"
              style={{ opacity: look.bracketAlpha }}
            />
            <span
              className="absolute inset-x-0 top-0 block bg-ink"
              style={{ height: 1, opacity: 0.5 }}
            />
            <span
              className="absolute inset-x-0 bottom-0 block bg-ink"
              style={{ height: 1, opacity: 0.5 }}
            />
          </div>
        )}

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
              top: -look.ghostThick / 2,
              width: railW,
              height: look.ghostThick,
              opacity: look.ghostAlpha,
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

// The frost's inner feather: full strength for the first `solid` percent
// from the outer edge, then a power-curve falloff — alpha = (1 - x)^gamma
// over the remaining span, sampled into gradient stops. Higher gamma spends
// its fade early and approaches the page on a long, invisible tail.
function frostMask(side: RulerSide, solid: number, gamma: number): string {
  const dir = side === "right" ? "to left" : "to right";
  const stops = [`black ${solid.toFixed(0)}%`];
  const steps = 8;
  for (let k = 1; k < steps; k++) {
    const x = k / steps;
    const a = Math.pow(1 - x, gamma);
    const pos = solid + x * (100 - solid);
    stops.push(`rgba(0,0,0,${a.toFixed(3)}) ${pos.toFixed(1)}%`);
  }
  stops.push("transparent 100%");
  return `linear-gradient(${dir}, ${stops.join(", ")})`;
}
