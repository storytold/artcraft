"use client";

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SEEDANCE_SHOWCASE } from "@/lib/landing-data";
import { watchThemeColors, type ThemeColors } from "@/lib/theme-colors";
import { useTunerStore } from "@/lib/tuner";
import {
  galaxyLayoutTuner,
  galaxyMotionTuner,
  galaxyLookTuner,
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

const CARD_VERT = /* glsl */ `
  uniform float uCurve;
  out vec2 vUv;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    // Bow the plane toward the camera: strongest at the card center,
    // flat at the edges. Applied in world space so it reads in px.
    float d2 = dot(position.xy, position.xy);
    world.z += uCurve * (0.25 - d2) * 2.0;
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
  in vec2 vUv;
  out vec4 outColor;

  const vec2 TAPS[12] = vec2[12](
    vec2(-0.326, -0.406), vec2(-0.840, -0.074), vec2(-0.696, 0.457),
    vec2(-0.203, 0.621), vec2(0.962, -0.195), vec2(0.473, -0.480),
    vec2(0.519, 0.767), vec2(0.185, -0.893), vec2(0.507, 0.064),
    vec2(0.896, 0.412), vec2(-0.322, -0.933), vec2(-0.792, -0.598)
  );

  void main() {
    // Cover-fit crop window; samples clamp inside it so blur taps never
    // bleed past the crop.
    vec2 uv = vUv * uRepeat + uOffset;
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
    outColor = vec4(col, uAlpha);
  }
`;

export default function HeroGalaxy() {
  const [ready, setReady] = useState(false);
  const [colors, setColors] = useState<ThemeColors | null>(null);
  const [onScreen, setOnScreen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

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
            <GalaxyScene colors={colors} onScreen={onScreen} />
          </Canvas>
        </CanvasBoundary>
      )}
    </div>
  );
}

function GalaxyScene({
  colors,
  onScreen,
}: {
  colors: ThemeColors;
  onScreen: boolean;
}) {
  const size = useThree((s) => s.size);
  const rigRef = useRef<THREE.Group>(null);
  const cardRefs = useRef<(THREE.Mesh | null)[]>([]);
  const state = useRef({ idleP: 0, spin: 0, cullTimer: 0 });

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
  const clipFit = useMemo(
    () =>
      SEEDANCE_SHOWCASE.map(() => ({
        rep: new THREE.Vector2(1, 1),
        off: new THREE.Vector2(0, 0),
      })),
    [],
  );
  const textures = useMemo(
    () =>
      videos.map((v, i) => {
        const t = new THREE.VideoTexture(v);
        // Cover-fit the source into a 16:9 card (GL has no object-cover):
        // crop the longer axis via a repeat/offset window the shader
        // samples through. Shared Vector2s, so late metadata propagates to
        // every material without re-wiring uniforms.
        const fit = () => {
          const va = v.videoWidth / v.videoHeight || 16 / 9;
          const pa = 16 / 9;
          if (va > pa) {
            clipFit[i].rep.set(pa / va, 1);
            clipFit[i].off.set((1 - pa / va) / 2, 0);
          } else {
            clipFit[i].rep.set(1, va / pa);
            clipFit[i].off.set(0, (1 - va / pa) / 2);
          }
        };
        if (v.readyState >= 1) fit();
        else v.addEventListener("loadedmetadata", fit, { once: true });
        return t;
      }),
    [videos, clipFit],
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
    // Prime a frozen first frame per clip, staggered so page load never
    // fights a burst of range requests. A paused seek decodes one frame —
    // exactly what the inner blurred cards need, no decoder kept.
    const timers = videos.map((v, i) =>
      setTimeout(() => {
        const seek = () => {
          if (v.paused && v.currentTime === 0) v.currentTime = 0.1;
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
    const cardN = Math.round(t.cardN);
    const rMax = (t.rMaxFrac * Math.hypot(size.width, size.height)) / 2;
    const thetaMax = t.turns * Math.PI * 2;
    const b = rMax / thetaMax;
    const cardH = Math.min(320, Math.max(70, size.height * t.cardHFrac));
    const slotsPerArm = Math.max(1, Math.ceil(cardN / arms));

    // Arm guide curves.
    const armGeoms: THREE.BufferGeometry[] = [];
    for (let j = 0; j < arms; j++) {
      const phase = (j * Math.PI * 2) / arms;
      const pts: number[] = [];
      const steps = 140;
      for (let k = 0; k <= steps; k++) {
        const theta = t.birthFrac * thetaMax * 0.3 + (k / steps) * thetaMax;
        if (theta > thetaMax) break;
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
      thetaBirth: t.birthFrac * thetaMax,
      b,
      cardH,
      cardW: (cardH * 16) / 9,
      minScale: t.minScale,
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
              uRepeat: { value: clipFit[c.clip].rep },
              uOffset: { value: clipFit[c.clip].off },
              uBg: { value: new THREE.Vector3(0.9, 0.9, 0.9) },
              uBlur: { value: 0 },
              uTexA: { value: 0 },
              uDim: { value: 1 },
              uAlpha: { value: 0 },
              uAber: { value: 0 },
              uCurve: { value: 0 },
            },
          }),
      ),
    [cards, textures, clipFit],
  );
  const frameMaterials = useMemo(
    () =>
      cards.map(
        () =>
          new THREE.LineBasicMaterial({
            transparent: true,
            depthTest: false,
            depthWrite: false,
            opacity: 0,
          }),
      ),
    [cards],
  );
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);
  useEffect(
    () => () => frameMaterials.forEach((m) => m.dispose()),
    [frameMaterials],
  );

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
  // would churn every mesh for nothing.
  useEffect(() => {
    const bg = hexToVec3(colors.bg);
    materials.forEach((m) => {
      (m.uniforms.uBg.value as THREE.Vector3).copy(bg);
    });
    frameMaterials.forEach((m) => m.color.set(colors.lineStrong));
    lineMat.color.set(colors.lineStrong);
    tickMat.color.set(colors.lineStrong);
  }, [colors, materials, frameMaterials, lineMat, tickMat]);

  // Shared unit geometries: the card plane (segmented for the curve warp)
  // and its hairline frame, both scaled per mesh.
  const unitPlane = useMemo(() => new THREE.PlaneGeometry(1, 1, 12, 12), []);
  const unitFrame = useMemo(
    () => new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1)),
    [],
  );
  useEffect(
    () => () => {
      unitPlane.dispose();
      unitFrame.dispose();
    },
    [unitPlane, unitFrame],
  );

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

  useFrame((st3, delta) => {
    const dt = Math.min(delta, 0.05);
    const st = state.current;
    const mv = galaxyMotionTuner.read();
    const lk = galaxyLookTuner.read();
    const t = st3.clock.elapsedTime;
    const L = layout;

    st.idleP += (dt * mv.idleSpeed) / 60;
    st.spin += (dt * THREE.MathUtils.degToRad(mv.spinDeg)) / 60;
    const P = st.idleP + (window.scrollY * mv.scrub) / 1000;
    if (rigRef.current) rigRef.current.rotation.z = st.spin;

    clipBest.fill(-1);

    for (let i = 0; i < cards.length; i++) {
      const mesh = cardRefs.current[i];
      if (!mesh) continue;
      const card = cards[i];

      const c = cycle(
        (card.slot + 0.5) / L.slotsPerArm + P + card.arm * L.armJitter,
      );
      const theta = L.thetaBirth + c * (L.thetaMax - L.thetaBirth);
      const r = L.b * theta;
      const a = theta + (card.arm * Math.PI * 2) / L.arms;
      const ux = Math.cos(a);
      const uy = Math.sin(a);
      // Floating noise: tangential + a lighter radial component, phased per
      // card so the cloud never moves in lockstep.
      const wobT = Math.sin(t * mv.wobbleFreq * Math.PI * 2 + i * 2.399);
      const wobR = Math.cos(t * mv.wobbleFreq * Math.PI * 2 * 0.7 + i * 1.713);
      const wx = mv.wobbleAmp * (wobT * -uy + 0.6 * wobR * ux);
      const wy = mv.wobbleAmp * (wobT * ux + 0.6 * wobR * uy);
      mesh.position.set(r * ux + wx, r * uy + wy, 0);
      mesh.rotation.z = -st.spin; // cards stay upright while the system spins
      const s = L.minScale + (1 - L.minScale) * c;
      mesh.scale.set(L.cardW * s, L.cardH * s, 1);
      mesh.renderOrder = 10 + Math.round(c * 100); // outer paints over inner

      const lifecycle =
        clamp01(c / lk.fadeBand) * clamp01((1 - c) / lk.fadeBand);
      const solid = lk.washInner + (1 - lk.washInner) * c;
      const intro = clamp01(
        (t - mv.introDelay - i * mv.introStagger) / Math.max(0.05, mv.introDur),
      );

      const ready = videos[card.clip].readyState >= 2 ? 1 : 0;
      videoAlpha[i] += (ready - videoAlpha[i]) * (1 - Math.exp(-3 * dt));
      const va = videoAlpha[i];

      const u = materials[i].uniforms;
      // Blur by journey position; a still-loading card holds max blur so
      // footage resolves through the same unblur it was born with.
      u.uBlur.value = Math.max(
        lk.blurMax * (1 - smoothstep(0, lk.blurEnd, c)),
        (1 - va) * lk.blurMax,
      );
      u.uTexA.value = va;
      u.uAber.value = lk.aberration;
      u.uCurve.value = lk.curvePx;
      if (dark) {
        u.uDim.value = lk.dim * solid;
        u.uAlpha.value = lifecycle * intro;
      } else {
        u.uDim.value = 1;
        u.uAlpha.value = lifecycle * solid * intro * Math.sqrt(lk.dim);
      }
      frameMaterials[i].opacity = lk.frameAlpha * lifecycle * intro;

      if (u.uAlpha.value > 0.04 && c > clipBest[card.clip]) {
        clipBest[card.clip] = c;
      }
    }

    // Underlay ink follows the look tuner and eases in on load.
    const lineIntro = smoothstep(0, 1, Math.min(1, t / 1.2));
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
        >
          {/* Hairline frame, matching the site's bordered viewport idiom. */}
          <lineSegments geometry={unitFrame} material={frameMaterials[i]} />
        </mesh>
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
