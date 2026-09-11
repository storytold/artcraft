"use client";

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SEEDANCE_SHOWCASE } from "@/lib/landing-data";
import { introClock, introTuner } from "@/lib/intro";
import { watchThemeColors, type ThemeColors } from "@/lib/theme-colors";
import { useTunerStore } from "@/lib/tuner";
import {
  galaxyLayoutTuner,
  galaxyMotionTuner,
  galaxyLookTuner,
  galaxyPointerTuner,
} from "./hero-galaxy-tunables";

// The hero galaxy: showcase cards swirling out of the centered wordmark
// along multiple spiral arms. Cards are born small and blurred at the
// origin — a soft nebula behind the brand mark — and grow, solidify, and
// unblur as they wind outward, fading off past the viewport edge while new
// ones surface: the tool at the center producing work that spirals out into
// the world. Scroll scrubs the conveyor (reversible); an idle drift and a
// slow global spin keep it alive unattended.
//
// Rendered as one WebGL scene (1 world unit == 1 CSS px at z=0): each card
// is a single draw call whose shader does everything cheap-but-finished —
// poisson blur driven by journey position (which doubles as the loading
// placeholder resolving into footage), slight curvature bowing the plane
// toward the camera, and chromatic dispersion toward the card edges. A
// hairline underlay of arm guide curves, ticks, and a dashed construction
// circle keeps a faint echo of the blueprint language (tunable to zero).
//
// Decode budget: only the sharp outer cards' clips hold live decoders;
// inner blurred cards freeze on a primed first frame. Reduced-motion,
// no-JS, hidden-tab, and WebGL-failure visitors get the plain poster.

const FOV = 30;

// Decode budget (see the frame loop): clips whose best card is past the
// look tuner's playFrac compete for MAX_PLAYING decoder slots; the rest
// pause after a short hold. Starting a decoder is the expensive moment, so
// only a few resume per tick. A scrolled-away hero parks everything after a
// grace period (the frame loop is stopped by then).
const CULL_TICK_S = 0.25;
const CULL_HOLD_S = 1.2;
const MAX_PLAYING = 8;
const RESUME_PER_TICK = 3;
const PARK_DELAY_MS = 2500;

// Length of the tick marks straddling the arm curves, world px.
const TICK_LEN = 12;

// The target's OPTICAL clear (dispersion, blur, warp, wash) always runs at
// this fast fixed pace — a focused card must look clean immediately. The
// Target tau knob governs only the behavioral ease (sizing pin, paint
// order, decode priority, wobble kill), which is what slow tunings want.
const CLEAR_TAU_S = 0.12;

const CARD_VERT = /* glsl */ `
  uniform float uCurve;
  uniform float uWarp;
  uniform vec2 uMouse;
  uniform vec2 uSize;
  out vec2 vUv;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    // Bow the plane toward the camera: strongest at the card center,
    // flat at the edges. Applied in world space so it reads in px.
    float d2 = dot(position.xy, position.xy);
    world.z += uCurve * (0.25 - d2) * 2.0;
    // The cursor's weight: a local bulge toward the camera at the point of
    // the card nearest the mouse (uMouse in card-local units, may lie
    // outside the card) — the surface leans into the hand.
    vec2 dpx = (position.xy - uMouse) * uSize;
    float rr = max(uSize.x, uSize.y) * 0.6;
    world.z += uWarp * exp(-dot(dpx, dpx) / (rr * rr));
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const CARD_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uRepeat;
  uniform vec2 uOffset;
  uniform vec3 uBg;
  uniform float uBlur;
  uniform float uTexA;
  uniform float uDim;
  uniform float uAlpha;
  uniform float uAber;
  uniform vec2 uSize;
  uniform float uRadius;
  uniform vec3 uFrameCol;
  uniform float uFrameA;
  // Local click punches: xy = ring center (card UV), z = ring radius px,
  // w = displacement amplitude px (0 = slot unused). uClickW is the ring
  // thickness in px — the "blur" of the circle driving the displacement.
  uniform vec4 uClick[4];
  uniform float uClickW;
  in vec2 vUv;
  out vec4 outColor;

  const vec2 TAPS[12] = vec2[12](
    vec2(-0.326, -0.406), vec2(-0.840, -0.074), vec2(-0.696, 0.457),
    vec2(-0.203, 0.621), vec2(0.962, -0.195), vec2(0.473, -0.480),
    vec2(0.519, 0.767), vec2(0.185, -0.893), vec2(0.507, 0.064),
    vec2(0.896, 0.412), vec2(-0.322, -0.933), vec2(-0.792, -0.598)
  );

  void main() {
    // Local click punches: a soft gaussian ring pushes the texture
    // radially outward from the click point — the classic blurred-circle
    // displacement, evaluated inline. Stackable across the four slots.
    vec2 uvL = vUv;
    for (int k = 0; k < 4; k++) {
      if (uClick[k].w > 0.001) {
        vec2 q = (vUv - uClick[k].xy) * uSize;
        float dq = length(q);
        float ring = (dq - uClick[k].z) / max(1.0, uClickW);
        uvL += (q / max(1.0, dq)) *
          (uClick[k].w * exp(-ring * ring)) / uSize;
      }
    }
    // Cover-fit crop window; samples clamp inside it so blur taps never
    // bleed past the crop.
    vec2 uv = uvL * uRepeat + uOffset;
    vec2 lo = uOffset;
    vec2 hi = uOffset + uRepeat;
    vec3 col;
    if (uBlur > 0.0008) {
      // Poisson disk with a per-pixel rotation — a cheap wide gaussian
      // stand-in that hides its tap count at nebula sizes.
      float a = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.545) * 6.2832;
      mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
      vec3 acc = texture(uMap, clamp(uv, lo, hi)).rgb;
      for (int i = 0; i < 12; i++) {
        acc += texture(uMap, clamp(uv + rot * TAPS[i] * uBlur, lo, hi)).rgb;
      }
      col = acc / 13.0;
    } else {
      // Sharp path: chromatic dispersion growing toward the card edges.
      vec2 d = vUv - 0.5;
      vec2 shift = d * dot(d, d) * 4.0 * uAber;
      col = vec3(
        texture(uMap, clamp(uv + shift, lo, hi)).r,
        texture(uMap, clamp(uv, lo, hi)).g,
        texture(uMap, clamp(uv - shift, lo, hi)).b
      );
    }
    col = mix(uBg, col, uTexA) * uDim;

    // Rounded-rect SDF in card px: antialiased corner cut, plus the
    // hairline frame drawn as a ~1px band riding the same edge (so it
    // follows the radius exactly).
    vec2 q = abs((vUv - 0.5) * uSize) - (0.5 * uSize - vec2(uRadius));
    float dEdge = length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - uRadius;
    float frameBand = 1.0 - smoothstep(0.5, 1.5, abs(dEdge + 1.0));
    col = mix(col, uFrameCol, frameBand * uFrameA);
    float aa = 1.0 - smoothstep(-0.75, 0.75, dEdge);
    outColor = vec4(col, uAlpha * aa);
  }
`;

// Pointer state in world px (origin at the hero center, y up), fed by the
// container's handlers and consumed by the scene every frame. `clicks` is a
// monotonic press counter the scene diffs to detect new clicks.
type GalaxyPointer = { x: number; y: number; active: boolean; clicks: number };

// A click's dispersion ripple. `start` is stamped with the scene clock the
// first frame the scene sees it (-1 until then).
type GalaxyRipple = { x: number; y: number; start: number };

export default function HeroGalaxy() {
  const [ready, setReady] = useState(false);
  const [colors, setColors] = useState<ThemeColors | null>(null);
  const [onScreen, setOnScreen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<GalaxyPointer>({
    x: 0,
    y: 0,
    active: false,
    clicks: 0,
  });
  const ripplesRef = useRef<GalaxyRipple[]>([]);

  // Pointer in world coordinates; a press anywhere in the hero spawns a
  // dispersion ripple (they stack). The content layer above is
  // pointer-events-none except the CTAs, so events land here.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const toWorld = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      pointerRef.current.x = e.clientX - rect.left - rect.width / 2;
      pointerRef.current.y = -(e.clientY - rect.top - rect.height / 2);
    };
    const onMove = (e: PointerEvent) => {
      toWorld(e);
      pointerRef.current.active = true;
    };
    const onLeave = () => {
      pointerRef.current.active = false;
    };
    const onDown = (e: PointerEvent) => {
      toWorld(e);
      pointerRef.current.clicks++;
      const r = ripplesRef.current;
      r.push({ x: pointerRef.current.x, y: pointerRef.current.y, start: -1 });
      if (r.length > 8) r.shift();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointercancel", onLeave);
    el.addEventListener("pointerdown", onDown);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointercancel", onLeave);
      el.removeEventListener("pointerdown", onDown);
    };
  }, []);

  // Gate: motion allowed and the tab actually foregrounded (a canvas born in
  // a hidden tab can come up blank).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const tick = () => {
      if (!document.hidden) {
        setReady(true);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!ready) return;
    return watchThemeColors(setColors);
  }, [ready]);

  // The hero sits at the top of a long page. Once it scrolls away there is
  // nothing to look at, so stop the render loop and let the cards park
  // their video decoders. Same when the tab goes to the background.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let intersecting = true;
    const sync = () => setOnScreen(intersecting && !document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry.isIntersecting;
        sync();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(container);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const active = ready && colors !== null;

  return (
    <div ref={containerRef} aria-hidden className="absolute inset-0">
      {active && (
        <CanvasBoundary>
          <Canvas
            tabIndex={-1}
            // Footage planes gain nothing from a 2x framebuffer; 1.5x plus
            // MSAA keeps the hairlines clean for a lot less fill.
            dpr={[1, 1.5]}
            frameloop={onScreen ? "always" : "never"}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            <FittedCamera />
            <GalaxyScene
              colors={colors}
              onScreen={onScreen}
              pointer={pointerRef}
              ripples={ripplesRef}
            />
          </Canvas>
        </CanvasBoundary>
      )}
    </div>
  );
}

function GalaxyScene({
  colors,
  onScreen,
  pointer,
  ripples,
}: {
  colors: ThemeColors;
  onScreen: boolean;
  pointer: React.RefObject<GalaxyPointer>;
  ripples: React.RefObject<GalaxyRipple[]>;
}) {
  const size = useThree((s) => s.size);
  const rigRef = useRef<THREE.Group>(null);
  const cardRefs = useRef<(THREE.Mesh | null)[]>([]);
  const state = useRef({
    // Monotonic scene time, accumulated from frame deltas. NEVER use the
    // r3f clock for timers here: frameloop="never" (hero offscreen) stops
    // it, and r3f restarts it from ZERO on resume — every clock-keyed
    // timer rewinds, replaying the intro on every scroll back up.
    time: 0,
    idleP: 0,
    spin: 0,
    cullTimer: 0,
    frameEma: 1 / 60,
    perfScale: 1,
    lastP: 0,
    holdTarget: 0,
    holdRest: 0,
    fieldK: 1,
    targetI: -1,
    useCounter: 10000,
    lastClicks: 0,
    boostOn: false,
    boostK: 0,
    boostCard: -1,
  });

  const dark = useMemo(() => {
    const c = hexToVec3(colors.bg);
    return c.x + c.y + c.z < 1.5;
  }, [colors.bg]);

  // One <video>, one shared texture, and one cover-fit window per clip.
  const videos = useMemo(
    () =>
      SEEDANCE_SHOWCASE.map((clip) => {
        const v = document.createElement("video");
        v.src = clip.src;
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        v.crossOrigin = "anonymous";
        v.disableRemotePlayback = true;
        // Metadata only: the decode budget pulls clips down as their cards
        // earn playback; the priming seek below fetches one frozen frame
        // for the cards that stay inner and blurred.
        v.preload = "metadata";
        return v;
      }),
    [],
  );
  // Native aspect per clip — the per-frame cover-fit needs it because each
  // card's own panel aspect morphs over its journey (square at birth).
  const clipVA = useMemo(() => {
    const a = new Float32Array(SEEDANCE_SHOWCASE.length);
    a.fill(16 / 9);
    return a;
  }, []);
  const textures = useMemo(
    () =>
      videos.map((v, i) => {
        const t = new THREE.VideoTexture(v);
        const record = () => {
          clipVA[i] = v.videoWidth / v.videoHeight || 16 / 9;
        };
        if (v.readyState >= 1) record();
        else v.addEventListener("loadedmetadata", record, { once: true });
        return t;
      }),
    [videos, clipVA],
  );

  // Video lifecycle keyed to the pool alone. Re-arm sources on every run:
  // React strict mode (and any remount) runs the cleanup, which unloads the
  // shared <video> elements the memo still holds.
  useEffect(() => {
    videos.forEach((v, i) => {
      if (!v.getAttribute("src")) {
        v.src = SEEDANCE_SHOWCASE[i].src;
        v.load();
      }
    });
    // Prime a frozen frame per clip, staggered so page load never fights a
    // burst of range requests. The seek target is a per-clip offset spread
    // across each clip's duration, so playback phases — and therefore loop
    // resets — never line up across the wall (most clips share a length).
    const timers = videos.map((v, i) =>
      setTimeout(() => {
        const seek = () => {
          if (!v.paused || v.currentTime !== 0) return;
          const usable = Math.max(0.2, (v.duration || 8) - 0.5);
          v.currentTime = 0.1 + ((i * 2.618) % usable);
        };
        if (v.readyState >= 1) seek();
        else v.addEventListener("loadedmetadata", seek, { once: true });
      }, 400 + i * 250),
    );
    return () => {
      timers.forEach(clearTimeout);
      textures.forEach((t) => t.dispose());
      videos.forEach((v) => {
        v.pause();
        v.removeAttribute("src");
        v.load();
      });
    };
  }, [videos, textures]);

  // Scrolled away or backgrounded: the frame loop is stopped, so nothing
  // would ever pause these. Park them all after a grace period; the budget
  // re-grants slots on the first frame after the hero comes back.
  useEffect(() => {
    if (onScreen) return;
    const timer = setTimeout(
      () => videos.forEach((v) => v.pause()),
      PARK_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [onScreen, videos]);

  // Layout tunables change the structure — debounce a rebuild.
  const [layoutVersion, setLayoutVersion] = useState(0);
  useEffect(() => {
    let last = JSON.stringify(galaxyLayoutTuner.read());
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useTunerStore.subscribe(() => {
      const now = JSON.stringify(galaxyLayoutTuner.read());
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

  // Structure: arm parameters plus the hairline underlay geometries. All in
  // world px (1 unit == 1 CSS px), origin at the viewport center.
  const layout = useMemo(() => {
    const t = galaxyLayoutTuner.read();
    const arms = Math.max(1, Math.round(t.arms));
    // Responsive count: the knob is tuned at a reference viewport area;
    // smaller viewports get proportionally fewer cards (the neighbor-gap
    // sizing then grows the survivors, so the field stays filled).
    const area = (size.width * size.height) / 1e6;
    const cardN = Math.max(
      6,
      Math.min(Math.round(t.cardN), Math.round((t.cardN * area) / t.tunedMpx)),
    );
    const halfDiag = Math.hypot(size.width, size.height) / 2;
    const rMax = t.rMaxFrac * halfDiag;
    const thetaMax = t.turns * Math.PI * 2;
    const b = rMax / thetaMax;
    const cardHCap = Math.min(340, Math.max(70, size.height * t.cardHFrac));
    const slotsPerArm = Math.max(1, Math.ceil(cardN / arms));
    const thetaBirth = t.birthFrac * thetaMax;
    // Cards travel until fully past the viewport corner (plus a card of
    // margin) before wrapping — the death is never on screen.
    const thetaExit = (halfDiag + cardHCap * 1.5) / b;
    // Arm guide curves, drawn out past the exit so cards never outrun the
    // linework.
    const armGeoms: THREE.BufferGeometry[] = [];
    for (let j = 0; j < arms; j++) {
      const phase = (j * Math.PI * 2) / arms;
      const pts: number[] = [];
      const steps = 160;
      for (let k = 0; k <= steps; k++) {
        const theta = thetaBirth * 0.3 + (k / steps) * (thetaExit - thetaBirth * 0.3);
        const r = b * theta;
        pts.push(r * Math.cos(theta + phase), r * Math.sin(theta + phase), -2);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
      armGeoms.push(g);
    }

    // Ticks straddling each arm's outer half, radially.
    const tickPts: number[] = [];
    const ticksPerArm = Math.round(t.ticksPerArm);
    for (let j = 0; j < arms; j++) {
      const phase = (j * Math.PI * 2) / arms;
      for (let k = 0; k < ticksPerArm; k++) {
        const theta = thetaMax * (0.45 + (0.55 * (k + 0.5)) / ticksPerArm);
        const r = b * theta;
        const a = theta + phase;
        const ux = Math.cos(a);
        const uy = Math.sin(a);
        tickPts.push(
          (r - TICK_LEN / 2) * ux, (r - TICK_LEN / 2) * uy, -2,
          (r + TICK_LEN / 2) * ux, (r + TICK_LEN / 2) * uy, -2,
        );
      }
    }
    const tickGeom = new THREE.BufferGeometry();
    tickGeom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(tickPts, 3),
    );

    // Dashed construction circle, built as explicit dash segments so no
    // line-distance bookkeeping is needed.
    const circPts: number[] = [];
    const cr = t.circFrac * rMax;
    const dashCount = Math.max(8, Math.round((Math.PI * cr) / 14));
    for (let k = 0; k < dashCount; k++) {
      const a0 = (k / dashCount) * Math.PI * 2;
      const a1 = a0 + Math.PI / dashCount;
      circPts.push(
        cr * Math.cos(a0), cr * Math.sin(a0), -2,
        cr * Math.cos(a1), cr * Math.sin(a1), -2,
      );
    }
    const circGeom = new THREE.BufferGeometry();
    circGeom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(circPts, 3),
    );

    return {
      arms,
      cardN,
      rMax,
      thetaMax,
      thetaBirth,
      thetaExit,
      b,
      cardHCap,
      armJitter: t.armJitter,
      slotsPerArm,
      armGeoms,
      tickGeom,
      circGeom,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, layoutVersion]);
  useEffect(
    () => () => {
      layout.armGeoms.forEach((g) => g.dispose());
      layout.tickGeom.dispose();
      layout.circGeom.dispose();
    },
    [layout],
  );

  // Per-card assignment and materials. Clips deal round-robin, so a clip
  // may appear on two cards — always far apart on the conveyor.
  const cards = useMemo(
    () =>
      Array.from({ length: layout.cardN }, (_, i) => ({
        clip: i % SEEDANCE_SHOWCASE.length,
        arm: i % layout.arms,
        slot: Math.floor(i / layout.arms),
      })),
    [layout],
  );
  // Index order is arm-aligned (arms deal round-robin), so anything that
  // reveals cards sequentially by index — the intro stagger, the governor
  // regrowing shed cards — would paint aligned rings. This golden-ratio
  // permutation scatters that order across arms and slots.
  const liveOrder = useMemo(() => {
    const idx = cards.map((_, i) => i);
    idx.sort((a, b) => ((a * 0.618034) % 1) - ((b * 0.618034) % 1));
    return idx;
  }, [cards]);
  const liveRank = useMemo(() => {
    const r = new Int32Array(cards.length);
    liveOrder.forEach((ci, k) => {
      r[ci] = k;
    });
    return r;
  }, [cards, liveOrder]);
  const materials = useMemo(
    () =>
      cards.map(
        (c) =>
          new THREE.ShaderMaterial({
            glslVersion: THREE.GLSL3,
            vertexShader: CARD_VERT,
            fragmentShader: CARD_FRAG,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            uniforms: {
              uMap: { value: textures[c.clip] },
              uRepeat: { value: new THREE.Vector2(1, 1) },
              uOffset: { value: new THREE.Vector2(0, 0) },
              uBg: { value: new THREE.Vector3(0.9, 0.9, 0.9) },
              uBlur: { value: 0 },
              uTexA: { value: 0 },
              uDim: { value: 1 },
              uAlpha: { value: 0 },
              uAber: { value: 0 },
              uCurve: { value: 0 },
              uSize: { value: new THREE.Vector2(160, 90) },
              uMouse: { value: new THREE.Vector2(0, 0) },
              uWarp: { value: 0 },
              uClick: {
                value: [
                  new THREE.Vector4(),
                  new THREE.Vector4(),
                  new THREE.Vector4(),
                  new THREE.Vector4(),
                ],
              },
              uClickW: { value: 20 },
              uRadius: { value: 0 },
              uFrameCol: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
              uFrameA: { value: 0 },
            },
          }),
      ),
    [cards, textures],
  );
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

  // Underlay materials (shared across arms/ticks/circle instances).
  const lineMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );
  const tickMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );
  useEffect(
    () => () => {
      lineMat.dispose();
      tickMat.dispose();
    },
    [lineMat, tickMat],
  );

  // Theme colors follow imperatively — recreating materials on a theme flip
  // would churn every mesh for nothing. A theme change only retargets;
  // the frame loop lerps toward the target so the WebGL layer cross-fades
  // in step with the DOM's 0.75s theme transition instead of snapping.
  const colorState = useRef({
    init: false,
    bg: new THREE.Vector3(0.9, 0.9, 0.9),
    frame: new THREE.Vector3(0.5, 0.5, 0.5),
    line: new THREE.Color("#888888"),
    tBg: new THREE.Vector3(0.9, 0.9, 0.9),
    tFrame: new THREE.Vector3(0.5, 0.5, 0.5),
    tLine: new THREE.Color("#888888"),
  });
  useEffect(() => {
    const cs = colorState.current;
    cs.tBg.copy(hexToVec3(colors.bg));
    cs.tFrame.copy(hexToVec3(colors.lineStrong));
    cs.tLine.set(colors.lineStrong);
    if (!cs.init) {
      cs.init = true;
      cs.bg.copy(cs.tBg);
      cs.frame.copy(cs.tFrame);
      cs.line.copy(cs.tLine);
    }
  }, [colors]);

  // Shared unit card plane, segmented for the curve warp and scaled per mesh.
  const unitPlane = useMemo(() => new THREE.PlaneGeometry(1, 1, 12, 12), []);
  useEffect(() => () => unitPlane.dispose(), [unitPlane]);

  // Underlay objects: arm curves as THREE.Line (r3f has no line intrinsic —
  // it collides with the SVG element), ticks and circle as segments.
  const underlay = useMemo(
    () => [
      ...layout.armGeoms.map((g) => new THREE.Line(g, lineMat)),
      new THREE.LineSegments(layout.circGeom, lineMat),
      new THREE.LineSegments(layout.tickGeom, tickMat),
    ],
    [layout, lineMat, tickMat],
  );

  // Per-card scratch state reused every frame so the loop allocates
  // nothing: positions and cycle for the two-pass sizing, plus the smoothed
  // heights (cards grow in from 0, shrink instantly when space demands).
  const cardPos = useMemo(() => new Float32Array(cards.length * 2), [cards]);
  const cardCyc = useMemo(() => new Float32Array(cards.length), [cards]);
  const cardH = useMemo(() => new Float32Array(cards.length), [cards]);
  // Pointer-interaction scratch: sweep flare, target-lock ease, per-card
  // conveyor phase offsets (the hold brake accumulates here), smoothed
  // tilt, and last cycle (NaN until first placed) for wrap detection.
  const cardFlare = useMemo(() => new Float32Array(cards.length), [cards]);
  const cardTargetK = useMemo(() => new Float32Array(cards.length), [cards]);
  const cardClearK = useMemo(() => new Float32Array(cards.length), [cards]);
  const cardPhase = useMemo(() => new Float32Array(cards.length), [cards]);
  const cardTiltX = useMemo(() => new Float32Array(cards.length), [cards]);
  const cardTiltY = useMemo(() => new Float32Array(cards.length), [cards]);
  const prevC = useMemo(() => {
    const a = new Float32Array(cards.length);
    a.fill(NaN);
    return a;
  }, [cards]);
  // Local click punches in flight: which card, where on it (card UV), and
  // when. Only the clicked card renders them.
  const clickPool = useRef<
    { card: number; u: number; v: number; start: number }[]
  >([]);

  // Least-recently-shown ordering for clip reassignment at rebirth. Seeded
  // to match the initial round-robin deal.
  const clipLastUsed = useMemo(() => {
    const a = new Float32Array(SEEDANCE_SHOWCASE.length);
    for (let i = 0; i < a.length; i++) a[i] = i;
    return a;
  }, []);

  // Per-card readiness easing and per-clip decode bookkeeping, reused every
  // frame so the loop allocates nothing.
  const videoAlpha = useMemo(() => new Float32Array(cards.length), [cards]);
  const clipBest = useMemo(
    () => new Float32Array(SEEDANCE_SHOWCASE.length),
    [],
  );
  const clipIdle = useMemo(
    () => new Float32Array(SEEDANCE_SHOWCASE.length),
    [],
  );
  const clipOrder = useMemo(() => SEEDANCE_SHOWCASE.map((_, i) => i), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const st = state.current;
    st.time += dt;
    const mv = galaxyMotionTuner.read();
    const lk = galaxyLookTuner.read();
    const pt = galaxyPointerTuner.read();
    const iv = introTuner.read();
    const t = st.time;
    const L = layout;

    // Intro clocks: the reveal wave sweeps from the logo past the edge
    // over introDur, and the conveyor opens at burst speed easing down to
    // its normal drift — the field arrives moving.
    const rollT = clamp01(
      (introClock.t - iv.cardsAt) / Math.max(0.1, mv.introDur),
    );
    const waveEase = easeOutCubic(rollT);
    // The dispersion ring launches on its own delayed clock, trailing the
    // reveal front and sweeping the already-revealed field behind it.
    const flareT = clamp01(
      (introClock.t - iv.cardsAt - mv.waveLag) / Math.max(0.1, mv.introDur),
    );
    const flareEase = easeOutCubic(flareT);
    const burstT = clamp01(
      (introClock.t - iv.cardsAt) / Math.max(0.1, mv.burstDur),
    );
    const burstK = 1 + (mv.burstX - 1) * (1 - easeOutCubic(burstT));

    st.idleP += (dt * mv.idleSpeed * burstK) / 60;
    // The global spin brakes with the rest of the spiral while a card is
    // held — the whole instrument stops under the hand.
    st.spin +=
      ((dt * THREE.MathUtils.degToRad(mv.spinDeg)) / 60) * (1 - st.holdRest);
    const P = st.idleP + (window.scrollY * mv.scrub) / 1000;
    if (rigRef.current) rigRef.current.rotation.z = st.spin;

    // The hold brake: while a card is targeted, its own conveyor motion
    // stops almost immediately and the rest of the spiral eases to a stop
    // just behind it — the cursor holds the whole instrument still. The
    // brake accumulates into per-card phase offsets, so releasing resumes
    // from wherever things stand (no snap-back).
    const dP = P - st.lastP;
    st.lastP = P;
    const targeting = st.targetI >= 0;
    st.holdTarget +=
      ((targeting ? 1 : 0) - st.holdTarget) *
      (1 - Math.exp(-dt / Math.max(0.01, pt.holdTau)));
    st.holdRest +=
      ((targeting ? 1 : 0) - st.holdRest) *
      (1 - Math.exp(-dt / Math.max(0.01, pt.restTau)));
    // Field strength eases off when a target locks (and back on release)
    // instead of hard-gating — a snapping tug/warp at the lock boundary
    // reads as the card ghosting between its straight and warped poses.
    st.fieldK +=
      ((targeting ? 0 : 1) - st.fieldK) * (1 - Math.exp(-dt / 0.12));

    clipBest.fill(-1);

    // Theme cross-fade: WebGL colors chase their targets at ~0.4s settle,
    // matching the DOM's theme transition.
    const cs = colorState.current;
    const themeK = 1 - Math.exp(-dt / 0.13);
    cs.bg.lerp(cs.tBg, themeK);
    cs.frame.lerp(cs.tFrame, themeK);
    cs.line.lerp(cs.tLine, themeK);
    lineMat.color.copy(cs.line);
    tickMat.color.copy(cs.line);

    // Perf governor: EMA of the real frame time. Sustained drops below the
    // FPS floor shed cards (and their decode pressure) quickly; recovery
    // regrows slowly so it never oscillates. The first seconds are a grace
    // period — page load always stutters (shader compile, video priming)
    // and shedding the intro looks like a broken spawn.
    st.frameEma += (Math.min(delta, 0.25) - st.frameEma) * 0.05;
    if (mv.perfFloor > 0 && t > 4) {
      const budget = 1 / mv.perfFloor;
      if (st.frameEma > budget) {
        st.perfScale = Math.max(0.35, st.perfScale - dt * 0.3);
      } else if (st.frameEma < budget * 0.7) {
        st.perfScale = Math.min(1, st.perfScale + dt * 0.05);
      }
    } else if (mv.perfFloor === 0) {
      st.perfScale = 1;
    }
    const liveN = Math.max(6, Math.round(cards.length * st.perfScale));

    const cosS = Math.cos(st.spin);
    const sinS = Math.sin(st.spin);
    const ptr = pointer.current;

    // Pass 1: place every live card along its arm (in permuted order — the
    // live set is the first liveN entries of liveOrder). All positions must
    // be known before any card can size itself against its neighbors.
    // Intro drift: cards start a small chunk short of their spread
    // positions and slide the remainder in as the wave uncovers them —
    // real outward motion everywhere, no long travel, no big rotation.
    const R = -mv.rollChunk * (1 - waveEase);
    for (let k = 0; k < liveN; k++) {
      const i = liveOrder[k];
      const card = cards[i];
      cardPhase[i] -=
        dP *
        (i === st.targetI
          ? Math.max(st.holdTarget, st.holdRest)
          : st.holdRest);
      const cFull = cycle(
        (card.slot + 0.5) / L.slotsPerArm +
          P +
          card.arm * L.armJitter +
          cardPhase[i],
      );
      const c = Math.max(0, cFull + R);
      cardCyc[i] = c;

      // Rebirth (the wrap always happens offscreen or at zero alpha): hand
      // the card the least-recently-shown clip, so repeats spread as far
      // apart as the pool allows. Suspended during the rollout — the fast
      // stream would read as false wraps.
      if (
        rollT >= 1 &&
        !Number.isNaN(prevC[i]) &&
        Math.abs(c - prevC[i]) > 0.5
      ) {
        let lru = 0;
        for (let cl = 1; cl < clipLastUsed.length; cl++) {
          if (clipLastUsed[cl] < clipLastUsed[lru]) lru = cl;
        }
        card.clip = lru;
        clipLastUsed[lru] = ++st.useCounter;
        materials[i].uniforms.uMap.value = textures[lru];
      }
      prevC[i] = c;

      const theta = L.thetaBirth + c * (L.thetaExit - L.thetaBirth);
      const r = L.b * theta;
      const a = theta + (card.arm * Math.PI * 2) / L.arms;
      const ux = Math.cos(a);
      const uy = Math.sin(a);
      // Floating noise: tangential + a lighter radial component, phased per
      // card; safe at any amp — sizing measures the real wobbled positions.
      // It swells while the spiral is held (the flow strains against the
      // brake) and dies on the targeted card so it can't slip the cursor.
      const wobAmp =
        mv.wobbleAmp *
        (1 + (pt.holdWobble - 1) * st.holdRest) *
        (1 - cardTargetK[i]);
      const wobT = Math.sin(t * mv.wobbleFreq * Math.PI * 2 + i * 2.399);
      const wobR = Math.cos(t * mv.wobbleFreq * Math.PI * 2 * 0.7 + i * 1.713);
      cardPos[i * 2] = r * ux + wobAmp * (wobT * -uy + 0.6 * wobR * ux);
      cardPos[i * 2 + 1] = r * uy + wobAmp * (wobT * ux + 0.6 * wobR * uy);

      // The tug: cards inside the field are actually displaced toward the
      // cursor (world delta rotated back into rig space). Baked into
      // cardPos BEFORE sizing, so the collision guarantee sees it. Scaled
      // by the eased field strength so the lock never snaps positions.
      if (ptr.active && pt.tugPx > 0 && st.fieldK > 0.001) {
        const wxp = cosS * cardPos[i * 2] - sinS * cardPos[i * 2 + 1];
        const wyp = sinS * cardPos[i * 2] + cosS * cardPos[i * 2 + 1];
        const dx = ptr.x - wxp;
        const dy = ptr.y - wyp;
        const d2 = dx * dx + dy * dy;
        const tug =
          pt.tugPx *
          Math.exp(-d2 / (pt.fieldPx * pt.fieldPx)) *
          st.fieldK *
          (1 - cardTargetK[i]);
        const inv = tug / Math.max(1, Math.sqrt(d2));
        cardPos[i * 2] += (cosS * dx + sinS * dy) * inv;
        cardPos[i * 2 + 1] += (-sinS * dx + cosS * dy) * inv;
      }
    }

    // Target pick: the card under the cursor — outermost wins on overlap,
    // and only that card is the target; everyone else returns to normal.
    // World-space point-in-rect test: the rig is spun, but cards stay
    // upright, so their rects are axis-aligned in world coordinates.
    let target = -1;
    let bestC = -1;
    const boostF = 1 + (pt.boostScale - 1) * st.boostK;
    if (ptr.active) {
      // Priority order — the boost is a display overlay, not a logical
      // footprint:
      //   1. The current target's TRUE (unboosted) rect + hysteresis
      //      margin retains unconditionally (the margin covers the
      //      tug-release slide so the lock can't flap at the edge).
      //   2. Outside that core, any OTHER card under the pointer wins —
      //      a card peeking from under an enlarged neighbor must take the
      //      focus the moment the pointer reaches its territory.
      //   3. The boosted rect retains only over empty space, so the lock
      //      still doesn't drop while viewing the outer half of a big
      //      card with nothing behind it.
      const cur = st.targetI;
      const margin = pt.tugPx + 8;
      let inCore = false;
      let inBoost = false;
      if (cur >= 0 && liveRank[cur] < liveN && cardH[cur] >= 8) {
        const wxp = cosS * cardPos[cur * 2] - sinS * cardPos[cur * 2 + 1];
        const wyp = sinS * cardPos[cur * 2] + cosS * cardPos[cur * 2 + 1];
        const dxa = Math.abs(ptr.x - wxp);
        const dya = Math.abs(ptr.y - wyp);
        const Hc = cardH[cur];
        inCore = dxa <= (Hc * 8) / 9 + margin && dya <= Hc / 2 + margin;
        const Hb = Hc * (cur === st.boostCard ? boostF : 1);
        inBoost = dxa <= (Hb * 8) / 9 + margin && dya <= Hb / 2 + margin;
      }
      if (inCore) {
        target = cur;
      } else {
        for (let k = 0; k < liveN; k++) {
          const i = liveOrder[k];
          if (i === cur) continue;
          const c = cardCyc[i];
          if (c < 0.04 || c <= bestC) continue;
          const H = cardH[i];
          if (H < 8) continue;
          const wxp = cosS * cardPos[i * 2] - sinS * cardPos[i * 2 + 1];
          const wyp = sinS * cardPos[i * 2] + cosS * cardPos[i * 2 + 1];
          if (
            Math.abs(ptr.x - wxp) <= (H * 8) / 9 &&
            Math.abs(ptr.y - wyp) <= H / 2
          ) {
            bestC = c;
            target = i;
          }
        }
        if (target < 0 && inBoost) target = cur;
      }
    }
    st.targetI = target;

    // Click consumption: a press on the held card toggles its scale boost;
    // leaving the card cancels it (non-persistent — the next hold needs a
    // fresh click). The boost eases both ways, so release scales the card
    // back down first.
    if (ptr.clicks !== st.lastClicks) {
      st.lastClicks = ptr.clicks;
      if (st.targetI >= 0) {
        // The local punch: capture the click point in the card's UV space
        // (sized as displayed at this instant, boost included).
        const ti = st.targetI;
        const twx = cosS * cardPos[ti * 2] - sinS * cardPos[ti * 2 + 1];
        const twy = sinS * cardPos[ti * 2] + cosS * cardPos[ti * 2 + 1];
        const tH = Math.max(
          1,
          cardH[ti] * (ti === st.boostCard ? boostF : 1),
        );
        const tAspect =
          1 + (16 / 9 - 1) * smoothstep(0, lk.aspectEnd, cardCyc[ti]);
        clickPool.current.push({
          card: ti,
          u: 0.5 + (ptr.x - twx) / (tH * tAspect),
          v: 0.5 + (ptr.y - twy) / tH,
          start: t,
        });
        if (clickPool.current.length > 8) clickPool.current.shift();

        if (st.boostCard === st.targetI) {
          st.boostOn = !st.boostOn;
        } else {
          st.boostCard = st.targetI;
          st.boostOn = true;
        }
      }
    }
    if (st.boostOn && st.targetI !== st.boostCard) st.boostOn = false;
    st.boostK +=
      ((st.boostOn ? 1 : 0) - st.boostK) *
      (1 - Math.exp(-dt / Math.max(0.01, pt.boostTau)));
    if (!st.boostOn && st.boostK < 0.001) st.boostCard = -1;

    // Ripples: stamp newcomers with the scene clock, expire the spent.
    const rip = ripples.current;
    for (let k = rip.length - 1; k >= 0; k--) {
      if (rip[k].start < 0) rip[k].start = t;
      if (t - rip[k].start > pt.rippleLife) rip.splice(k, 1);
    }
    const punches = clickPool.current;
    for (let k = punches.length - 1; k >= 0; k--) {
      if (t - punches[k].start > pt.clickDur) punches.splice(k, 1);
    }
    const maxTilt = (pt.tiltDeg * Math.PI) / 180;

    for (let i = 0; i < cards.length; i++) {
      const mesh = cardRefs.current[i];
      if (!mesh) continue;
      if (liveRank[i] >= liveN) {
        mesh.visible = false;
        continue;
      }
      if (!mesh.visible) {
        // Shed card returning: grow back in from nothing rather than
        // popping at full size.
        cardH[i] = 0;
        mesh.visible = true;
      }
      const card = cards[i];
      const c = cardCyc[i];
      const x = cardPos[i * 2];
      const y = cardPos[i * 2 + 1];

      // Target-lock eases, needed by the sizing below (a held card sizes
      // differently), so they resolve before anything else. tk (Target
      // tau) is the behavioral ease; ck is the fixed fast optical clear.
      const tk = (cardTargetK[i] +=
        ((i === st.targetI ? 1 : 0) - cardTargetK[i]) *
        (1 - Math.exp(-dt / Math.max(0.01, pt.targetTau))));
      const ck = (cardClearK[i] +=
        ((i === st.targetI ? 1 : 0) - cardClearK[i]) *
        (1 - Math.exp(-dt / CLEAR_TAU_S)));

      // Pass 2: exact collision-free sizing against the actual nearest
      // neighbor. For upright 16:9 rectangles, two cards clear each other
      // iff their center gap beats their half-extents on either axis; when
      // every card takes density × its nearest such separation, no pair
      // can ever overlap (each contributes at most half the gap). Growth
      // is eased so freed space fills organically; shrinking is instant so
      // the guarantee never breaks mid-frame. Exception: a locked card must
      // not pulse with its neighbors' wobble, so its size is pinned on a
      // smooth ease and NEIGHBORS yield the exact remainder against its
      // actual height instead.
      let sep = Infinity;
      let capVsHeld = Infinity;
      for (let k = 0; k < liveN; k++) {
        const j = liveOrder[k];
        if (j === i) continue;
        const m = Math.max(
          (Math.abs(cardPos[j * 2] - x) * 9) / 16,
          Math.abs(cardPos[j * 2 + 1] - y),
        );
        if (j === st.targetI && cardTargetK[j] > 0.3) {
          const rem = Math.max(0, 2 * m - cardH[j]) * 0.98;
          if (rem < capVsHeld) capVsHeld = rem;
        } else if (m < sep) {
          sep = m;
        }
      }
      // Inner cards stay smaller than outer ones even when space would
      // allow more: the size ceiling itself ramps up over the journey.
      const capEff = L.cardHCap * (lk.innerCap + (1 - lk.innerCap) * c);
      const goalH = Math.min(capEff, lk.density * sep, capVsHeld);
      if (tk > 0.3) {
        cardH[i] += (goalH - cardH[i]) * (1 - Math.exp(-6 * dt));
      } else {
        cardH[i] =
          goalH < cardH[i]
            ? goalH
            : cardH[i] + (goalH - cardH[i]) * (1 - Math.exp(-3 * dt));
      }
      // The click boost enlarges only the display size — cardH (the sizing
      // state neighbors yield against) stays unboosted, so the enlarged
      // card may overlap its neighbors by design.
      const H =
        Math.max(0.001, cardH[i]) * (i === st.boostCard ? boostF : 1);
      // Newborns are rounded squares that morph into 16:9 as they grow.
      // The neighbor separation above assumes the full 16:9 width, so the
      // narrower young cards are strictly safer.
      const aspect = 1 + (16 / 9 - 1) * smoothstep(0, lk.aspectEnd, c);
      const W = H * aspect;

      // Interaction: the target lock eases the card into a straight, clean,
      // focused view (and back on release); the cursor field tilts its
      // neighbors toward the hand and leaves a dispersion trail behind
      // sweeps; click ripples add rings of dispersion that stack.
      const wxp = cosS * x - sinS * y;
      const wyp = sinS * x + cosS * y;
      let fall = 0;
      let tiltGX = 0;
      let tiltGY = 0;
      // The field eases off while a card is targeted (everyone else
      // returns to usual) and back on release — via the smoothed fieldK,
      // never a hard gate.
      if (ptr.active && st.fieldK > 0.001) {
        const dx = ptr.x - wxp;
        const dy = ptr.y - wyp;
        const d2 = dx * dx + dy * dy;
        fall = Math.exp(-d2 / (pt.fieldPx * pt.fieldPx)) * st.fieldK;
        const inv = 1 / Math.max(1, Math.sqrt(d2));
        // Lean toward the cursor, like being gently pulled at.
        tiltGY = maxTilt * dx * inv * fall;
        tiltGX = maxTilt * dy * inv * fall;
      }
      const tiltK = 1 - Math.exp(-10 * dt);
      cardTiltX[i] += (tiltGX * (1 - ck) - cardTiltX[i]) * tiltK;
      cardTiltY[i] += (tiltGY * (1 - ck) - cardTiltY[i]) * tiltK;
      cardFlare[i] = Math.max(
        cardFlare[i] * Math.exp(-pt.flareDecay * dt),
        pt.flareAdd * fall,
      );
      let rippleBoost = 0;
      for (let k = 0; k < rip.length; k++) {
        const age = t - rip[k].start;
        const band =
          (Math.hypot(wxp - rip[k].x, wyp - rip[k].y) -
            age * pt.rippleSpeed) /
          pt.rippleWidth;
        rippleBoost +=
          pt.rippleAmp * Math.exp(-band * band) * (1 - age / pt.rippleLife);
      }

      mesh.position.set(x, y, 0);
      // Upright while the system spins, plus the cursor-field lean.
      mesh.rotation.set(cardTiltX[i], cardTiltY[i], -st.spin);
      mesh.scale.set(W, H, 1);
      // Outer paints over inner; the target lifts above everything.
      mesh.renderOrder = 10 + Math.round(c * 100) + Math.round(tk * 500);

      // Birth fade only: the death happens fully offscreen past thetaExit.
      const lifecycle = clamp01(c / lk.fadeBand);
      const solid = lk.washInner + (1 - lk.washInner) * c;
      // The reveal wave: a front expanding from the logo uncovers cards in
      // radius order — fade + rack-from-blur as it crosses (waveK), with a
      // dispersion flash riding the front itself (waveG).
      let waveK = 1;
      let waveG = 0;
      if (rollT < 1 || (flareT > 0 && flareT < 1)) {
        const rr = L.b * (L.thetaBirth + c * (L.thetaExit - L.thetaBirth));
        const band = Math.max(1, mv.waveBand);
        if (rollT < 1) {
          const waveR = waveEase * L.b * L.thetaExit;
          // The band TRAILS the front: a card stays fully hidden until the
          // front reaches it, then resolves over the band behind it. (As a
          // leading edge, the band covered the innermost cards at radius
          // zero — partly-visible center cards before the beat.)
          waveK = clamp01((waveR - rr) / band);
        }
        if (flareT > 0 && flareT < 1) {
          const fr = (rr - flareEase * L.b * L.thetaExit) / band;
          waveG = Math.exp(-fr * fr);
        }
      }

      const ready = videos[card.clip].readyState >= 2 ? 1 : 0;
      videoAlpha[i] += (ready - videoAlpha[i]) * (1 - Math.exp(-3 * dt));
      const va = videoAlpha[i];

      const u = materials[i].uniforms;
      (u.uBg.value as THREE.Vector3).copy(cs.bg);
      (u.uFrameCol.value as THREE.Vector3).copy(cs.frame);
      // Cover-fit the clip into the card's current (morphing) aspect.
      const srcA = clipVA[card.clip];
      const rep = u.uRepeat.value as THREE.Vector2;
      const off = u.uOffset.value as THREE.Vector2;
      if (srcA > aspect) {
        rep.set(aspect / srcA, 1);
        off.set((1 - aspect / srcA) / 2, 0);
      } else {
        rep.set(1, srcA / aspect);
        off.set(0, (1 - srcA / aspect) / 2);
      }
      // Blur by journey position; a still-loading card holds max blur so
      // footage resolves through the same unblur it was born with. The
      // target lock racks everything clean: blur, dispersion, and warp all
      // clear as the card straightens into focus.
      u.uBlur.value = Math.max(
        lk.blurMax * (1 - smoothstep(0, lk.blurEnd, c)) * (1 - ck),
        (1 - va) * lk.blurMax,
        (1 - waveK) * lk.blurMax,
      );
      u.uTexA.value = va;
      u.uAber.value =
        (lk.aberration + cardFlare[i] + rippleBoost + mv.waveAber * waveG) *
        (1 - ck);
      // Click-ripple feedback is physical as well as chromatic: the
      // surface pops toward the camera as the ring passes (normalized so
      // tuning the amp doesn't change the pop height).
      const ringK = Math.min(2, rippleBoost / Math.max(0.002, pt.rippleAmp));
      u.uCurve.value = (lk.curvePx + pt.rippleWarp * ringK) * (1 - ck);
      // The cursor's weight on the surface: local bulge toward the mouse
      // point in card-local units (cards are upright, so world axes are
      // card axes).
      (u.uMouse.value as THREE.Vector2).set(
        (ptr.x - wxp) / Math.max(1, W),
        (ptr.y - wyp) / Math.max(1, H),
      );
      u.uWarp.value = pt.mouseWarp * fall * (1 - ck);
      (u.uSize.value as THREE.Vector2).set(W, H);
      // Local click punches: fill this card's slots (newest four), zero
      // the rest. Ring radius travels click-point → past the edges over
      // the punch duration; amplitude dies with it.
      const clickArr = u.uClick.value as THREE.Vector4[];
      let slot = 0;
      for (let k = 0; k < punches.length && slot < 4; k++) {
        const cr = punches[k];
        if (cr.card !== i) continue;
        const e = (t - cr.start) / Math.max(0.05, pt.clickDur);
        if (e >= 1) continue;
        clickArr[slot++].set(
          cr.u,
          cr.v,
          e * 0.85 * Math.max(W, H),
          pt.clickAmp * (1 - e),
        );
      }
      for (; slot < 4; slot++) clickArr[slot].w = 0;
      u.uClickW.value = pt.clickWidth * Math.max(W, H);
      u.uRadius.value = Math.min(lk.cornerPx, H * 0.49);
      u.uFrameA.value = lk.frameAlpha;
      if (dark) {
        u.uDim.value = lk.dim * solid + (1 - lk.dim * solid) * ck;
        u.uAlpha.value = lifecycle * waveK;
      } else {
        const wash = solid * Math.sqrt(lk.dim);
        u.uAlpha.value = lifecycle * waveK * (wash + (1 - wash) * ck);
        u.uDim.value = 1;
      }

      // A targeted card's clip outranks everything in the decode budget so
      // it plays immediately, wherever it is on the journey.
      const pri = tk > 0.05 ? 2 : c;
      if ((u.uAlpha.value > 0.04 || tk > 0.05) && pri > clipBest[card.clip]) {
        clipBest[card.clip] = pri;
      }
    }

    // Underlay ink follows the look tuner; the linework draws up at the
    // instrument beat, together with the ruler's tick cascade.
    const lineIntro = smoothstep(
      0,
      1,
      clamp01((introClock.t - iv.instrAt) / 1.2),
    );
    lineMat.opacity = lk.lineAlpha * lineIntro;
    tickMat.opacity = lk.tickAlpha * lineIntro;

    st.cullTimer -= dt;
    if (st.cullTimer <= 0) {
      st.cullTimer = CULL_TICK_S;
      applyDecodeBudget(
        videos,
        clipBest,
        clipIdle,
        clipOrder,
        lk.playFrac,
        CULL_TICK_S,
      );
    }
  });

  return (
    <group ref={rigRef}>
      {underlay.map((o, j) => (
        <primitive key={j} object={o} />
      ))}
      {cards.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            cardRefs.current[i] = el;
          }}
          geometry={unitPlane}
          material={materials[i]}
          scale={[1, 1, 1]}
        />
      ))}
    </group>
  );
}

// Hand the scarce decoders to the clips whose best card is furthest along
// (the sharp outer ones), and only past the play threshold — inner blurred
// cards keep their primed frozen frame. `elapsed` is the time since the
// previous call: this runs on the cull tick, not every frame.
function applyDecodeBudget(
  videos: HTMLVideoElement[],
  clipBest: Float32Array,
  clipIdle: Float32Array,
  clipOrder: number[],
  playFrac: number,
  elapsed: number,
) {
  clipOrder.sort((a, b) => clipBest[b] - clipBest[a]);
  let started = 0;
  for (let rank = 0; rank < clipOrder.length; rank++) {
    const clip = clipOrder[rank];
    const v = videos[clip];
    if (rank < MAX_PLAYING && clipBest[clip] >= playFrac) {
      clipIdle[clip] = 0;
      if (v.paused && started < RESUME_PER_TICK) {
        started++;
        v.play().catch(() => {});
      }
      continue;
    }
    clipIdle[clip] += elapsed;
    if (clipIdle[clip] >= CULL_HOLD_S && !v.paused) v.pause();
  }
}

// Perspective camera fitted so 1 world unit == 1 CSS pixel on the z=0 plane:
// layout math runs in pixels.
function FittedCamera() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  useEffect(() => {
    const dist = size.height / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    camera.fov = FOV;
    camera.position.set(0, 0, dist);
    camera.near = Math.max(1, dist - 1200);
    camera.far = dist + 1200;
    camera.updateProjectionMatrix();
  }, [camera, size.height]);
  return null;
}

class CanvasBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// ————— Leaf helpers —————

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const cycle = (x: number) => ((x % 1) + 1) % 1;

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

// Raw sRGB components for shader uniforms, bypassing THREE.Color's working
// color space conversion (the shader passes sRGB straight through).
function hexToVec3(hex: string): THREE.Vector3 {
  const n = parseInt(hex.replace("#", ""), 16);
  return new THREE.Vector3(
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255,
  );
}
