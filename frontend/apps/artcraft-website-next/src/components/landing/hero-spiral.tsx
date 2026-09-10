"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useTunerStore, type TunableDef, type TunableReader } from "@/lib/tuner";
import type { SeedanceClip } from "@/lib/landing-data";
import LazyVideo from "@/components/lazy-video";
import {
  spiralLayoutTuner,
  spiralMotionTuner,
  spiralLookTuner,
} from "./hero-spiral-tunables";

// The hero's creative element: a blueprint spiral — an Archimedean curve
// etched into the paper as a technical drawing (hairline linework, degree
// ticks, mono annotations, a dashed construction circle), with render cards
// pinned along the winding. The spiral is an emitter: cards are born small
// and faint near the origin and grow as they wind outward — the tool at the
// center producing work that spirals out into the world. Scroll advances the
// conveyor (reversible); an idle mechanical drift keeps it alive between.
//
// Everything is SSR-complete: the linework is deterministic SVG and the
// cards' resting poses are inline styles, so no-JS and reduced-motion
// visitors get the finished drawing. Client JS only animates deltas.

// The drawing lives on a fixed 1600×900 stage that covers the hero like
// background-size: cover (container-query math, no JS measurement), so
// geometry is computed once in stage units and scales with the viewport.
const STAGE_W = 1600;
const STAGE_H = 900;

const MONO_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.12em",
  fontSize: 10,
};

type Tick = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  major: boolean;
};

type TickLabel = { x: number; y: number; text: string };

type Geom = {
  cx: number;
  cy: number;
  b: number;
  phase: number;
  thetaMax: number;
  thetaBirth: number;
  rMax: number;
  pathD: string;
  ticks: Tick[];
  tickLabels: TickLabel[];
  constrR: number;
  radLine: { x2: number; y2: number; lx: number; ly: number; text: string };
  exclX: number;
  exclY: number;
  exclFeather: number;
  cardW: number;
  cardN: number;
};

type LayoutValues = { [K in keyof typeof spiralLayoutTuner.defs]: number };
type LookValues = { [K in keyof typeof spiralLookTuner.defs]: number };

type CardPose = { x: number; y: number; scale: number; alpha: number };

export default function HeroSpiral({ clips }: { clips: SeedanceClip[] }) {
  // -1 = SSR/hydration render: use the registered defaults so server and
  // client HTML agree even when localStorage holds tuner overrides. After
  // mount the live values apply and every tuner change re-renders (debounced).
  const [tunedV, setTunedV] = useState(-1);
  const stageRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const inkRef = useRef<SVGGElement>(null);
  const cardEls = useRef<(HTMLDivElement | null)[]>([]);
  const conveyorRef = useRef({ idleP: 0, introT: 0, pxScale: 1 });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const apply = () => setTunedV(useTunerStore.getState().version);
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

  const layout = useMemo(
    () => (tunedV < 0 ? defaultsOf(spiralLayoutTuner) : spiralLayoutTuner.read()),
    [tunedV],
  );
  const look = useMemo(
    () => (tunedV < 0 ? defaultsOf(spiralLookTuner) : spiralLookTuner.read()),
    [tunedV],
  );
  const geom = useMemo(() => buildGeometry(layout), [layout]);

  // Resting poses (conveyor at 0). Cards sit at half-slot offsets so none is
  // born exactly at the wrap seam (alpha 0) in the static drawing.
  const bases = useMemo(
    () =>
      Array.from({ length: geom.cardN }, (_, i) =>
        cardPose(geom, look, (i + 0.5) / geom.cardN),
      ),
    [geom, look],
  );
  const geomRef = useRef(geom);
  const basesRef = useRef(bases);
  geomRef.current = geom;
  basesRef.current = bases;

  // Stage scale: stage units → CSS px, for the per-frame delta transforms.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      conveyorRef.current.pxScale = stage.clientWidth / STAGE_W || 1;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  // The conveyor loop: scroll-scrubbed + idle drift, intro gate on top.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const state = conveyorRef.current;
    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(0.1, deltaMs / 1000);
      const mv = spiralMotionTuner.read();
      const lk = spiralLookTuner.read();
      const g = geomRef.current;
      state.idleP += (dt * mv.idleSpeed) / 60;
      state.introT += dt;
      const p = state.idleP + (window.scrollY * mv.scrub) / 1000;
      for (let i = 0; i < cardEls.current.length; i++) {
        const el = cardEls.current[i];
        const base = basesRef.current[i];
        if (!el || !base) continue;
        const pose = cardPose(g, lk, cycle((i + 0.5) / g.cardN + p));
        const dx = (pose.x - base.x) * state.pxScale;
        const dy = (pose.y - base.y) * state.pxScale;
        const introK = clamp01(
          (state.introT - mv.introDelay - i * mv.introStagger) / 0.5,
        );
        el.style.transform = `translate(-50%, -50%) translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${pose.scale.toFixed(3)})`;
        el.style.opacity = (pose.alpha * introK).toFixed(3);
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  // Intro: the line dash-draws origin→edge, then the ink (ticks, labels,
  // construction) fades up along it. Cards gate themselves in the loop.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const path = pathRef.current;
    const ink = inkRef.current;
    if (!path || !ink) return;
    const mv = spiralMotionTuner.read();
    const tl = gsap.timeline();
    tl.fromTo(
      path,
      { strokeDasharray: 1, strokeDashoffset: 1 },
      {
        strokeDashoffset: 0,
        duration: mv.introDur,
        ease: "power2.out",
        clearProps: "strokeDasharray,strokeDashoffset",
      },
    );
    tl.from(
      ink.children,
      { opacity: 0, duration: 0.5, stagger: 0.012, ease: "none" },
      mv.introDur * 0.35,
    );
    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden [container-type:size]">
      <div
        ref={stageRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: `max(100cqw, ${(100 * STAGE_W) / STAGE_H}cqh)`,
          height: `max(100cqh, ${(100 * STAGE_H) / STAGE_W}cqw)`,
        }}
      >
        <svg
          viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
          className="absolute inset-0 h-full w-full"
        >
          <path
            ref={pathRef}
            d={geom.pathD}
            pathLength={1}
            fill="none"
            stroke="var(--line-strong)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            opacity={look.lineAlpha}
          />
          <g ref={inkRef}>
            {geom.ticks.map((t, i) => (
              <line
                key={`t${i}`}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke="var(--line-strong)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                opacity={t.major ? look.tickAlpha : look.tickAlpha * 0.6}
              />
            ))}
            {geom.tickLabels.map((l, i) => (
              <text
                key={`l${i}`}
                x={l.x}
                y={l.y}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ ...MONO_STYLE, fill: "var(--muted)" }}
                opacity={look.labelAlpha}
              >
                {l.text}
              </text>
            ))}
            <circle
              cx={geom.cx}
              cy={geom.cy}
              r={geom.constrR}
              fill="none"
              stroke="var(--line-strong)"
              strokeWidth={1}
              strokeDasharray="5 6"
              vectorEffect="non-scaling-stroke"
              opacity={look.constrAlpha}
            />
            <line
              x1={geom.cx}
              y1={geom.cy}
              x2={geom.radLine.x2}
              y2={geom.radLine.y2}
              stroke="var(--line-strong)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              opacity={look.constrAlpha}
            />
            <text
              x={geom.radLine.lx}
              y={geom.radLine.ly}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ ...MONO_STYLE, fill: "var(--muted)" }}
              opacity={look.labelAlpha}
            >
              {geom.radLine.text}
            </text>
            <line
              x1={geom.cx - 10}
              y1={geom.cy}
              x2={geom.cx + 10}
              y2={geom.cy}
              stroke="var(--ink)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              opacity={look.tickAlpha}
            />
            <line
              x1={geom.cx}
              y1={geom.cy - 10}
              x2={geom.cx}
              y2={geom.cy + 10}
              stroke="var(--ink)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              opacity={look.tickAlpha}
            />
            <text
              x={geom.cx + 16}
              y={geom.cy - 12}
              style={{ ...MONO_STYLE, fill: "var(--muted)" }}
              opacity={look.labelAlpha}
            >
              ORIGIN 0,0
            </text>
          </g>
        </svg>

        {bases.map((base, i) => {
          const clip = clips[i % clips.length];
          const clipNo = String((i % clips.length) + 1).padStart(3, "0");
          return (
            <div
              key={i}
              ref={(el) => {
                cardEls.current[i] = el;
              }}
              className="absolute"
              style={{
                left: `${((base.x / STAGE_W) * 100).toFixed(2)}%`,
                top: `${((base.y / STAGE_H) * 100).toFixed(2)}%`,
                width: `${((geom.cardW / STAGE_W) * 100).toFixed(2)}%`,
                transform: `translate(-50%, -50%) scale(${base.scale.toFixed(3)})`,
                opacity: base.alpha.toFixed(3),
                willChange: "transform, opacity",
              }}
            >
              <div className="border border-line-strong bg-bg-sunken">
                <LazyVideo
                  src={clip.src}
                  className="block aspect-video w-full object-cover"
                />
              </div>
              <p
                className="mt-1 font-mono text-[9px] tracking-[0.15em] text-faint uppercase"
              >
                Seedance 2.5 · {clipNo}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ————— Geometry —————

// Archimedean spiral r = b·θ, drawn in stage units. All derived marks (ticks,
// labels, construction) come from the same parameters so the drawing always
// agrees with the cards' travel path.
function buildGeometry(v: LayoutValues): Geom {
  const cx = v.cx * STAGE_W;
  const cy = v.cy * STAGE_H;
  const thetaMax = v.turns * Math.PI * 2;
  const b = v.rMax / thetaMax;
  const phase = (v.phaseDeg * Math.PI) / 180;

  const pts: string[] = [];
  const steps = 480;
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * thetaMax;
    const r = b * theta;
    const a = theta + phase;
    pts.push(
      `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`,
    );
  }
  const pathD = `M ${pts.join(" L ")}`;

  const ticks: Tick[] = [];
  const tickLabels: TickLabel[] = [];
  const tickRad = (v.tickDeg * Math.PI) / 180;
  const rMin = v.tickMinFrac * v.rMax;
  for (let k = 0; k * tickRad <= thetaMax; k++) {
    const theta = k * tickRad;
    const r = b * theta;
    if (r < rMin) continue;
    const a = theta + phase;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    const major = k % v.majorEvery === 0;
    const len = major ? v.tickLen * 2 : v.tickLen;
    ticks.push({
      x1: cx + (r - len / 2) * ux,
      y1: cy + (r - len / 2) * uy,
      x2: cx + (r + len / 2) * ux,
      y2: cy + (r + len / 2) * uy,
      major,
    });
    if (major) {
      // Accumulated θ, spiral-honest: it keeps counting past 360.
      tickLabels.push({
        x: cx + (r + len / 2 + 16) * ux,
        y: cy + (r + len / 2 + 16) * uy,
        text: `${Math.round(k * v.tickDeg)}°`,
      });
    }
  }

  const constrR = v.constrFrac * v.rMax;
  const ra = (v.radDeg * Math.PI) / 180;
  const radLine = {
    x2: cx + constrR * Math.cos(ra),
    y2: cy + constrR * Math.sin(ra),
    lx: cx + (constrR / 2) * Math.cos(ra) - 14 * Math.sin(ra),
    ly: cy + (constrR / 2) * Math.sin(ra) + 14 * Math.cos(ra),
    text: `R ${Math.round(constrR)}`,
  };

  return {
    cx,
    cy,
    b,
    phase,
    thetaMax,
    thetaBirth: v.birthFrac * thetaMax,
    rMax: v.rMax,
    pathD,
    ticks,
    tickLabels,
    constrR,
    radLine,
    exclX: v.exclX * STAGE_W,
    exclY: v.exclY * STAGE_H,
    exclFeather: v.exclFeather,
    cardW: v.cardW,
    cardN: v.cardN,
  };
}

// A card's pose at cycle position c ∈ [0,1): born faint and small near the
// origin, full-grown at the outer end. The exclusion term fades cards out of
// the copy block's bottom-left zone; the fade bands hide the conveyor wrap.
function cardPose(g: Geom, lk: LookValues, c: number): CardPose {
  const theta = g.thetaBirth + c * (g.thetaMax - g.thetaBirth);
  const r = g.b * theta;
  const a = theta + g.phase;
  const x = g.cx + r * Math.cos(a);
  const y = g.cy + r * Math.sin(a);
  const scale = lk.minScale + (1 - lk.minScale) * c;
  const fade =
    clamp01(c / lk.fadeBand) * clamp01((1 - c) / lk.fadeBand);
  const wash = lk.washInner + (1 - lk.washInner) * c;
  const inZone =
    smooth01((g.exclX - x) / g.exclFeather) *
    smooth01((y - g.exclY) / g.exclFeather);
  return { x, y, scale, alpha: fade * wash * (1 - inZone) };
}

// ————— Leaf helpers —————

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const cycle = (x: number) => ((x % 1) + 1) % 1;

function smooth01(t: number) {
  const u = clamp01(t);
  return u * u * (3 - 2 * u);
}

function defaultsOf<T extends Record<string, TunableDef>>(
  tuner: TunableReader<T>,
): { [K in keyof T]: number } {
  const out = {} as { [K in keyof T]: number };
  for (const key in tuner.defs) out[key] = tuner.defs[key].default;
  return out;
}
