"use client";

import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { watchThemeColors, type ThemeColors } from "@/lib/theme-colors";
import {
  sampleWordmark,
  WordmarkSim,
  DEFAULT_PARAMS,
  type SampledWordmark,
} from "./wordmark-sim";

const WORDMARK = "artcraft";
const FONT_WEIGHT = 700;

type PointerState = {
  x: number;
  y: number;
  active: boolean;
};

// The hero wordmark: "artcraft" built from small 3D balls. The cursor is both
// a point light and a push force — the balls part around it, pop toward the
// viewer, and rejoin on their springs. On mount they assemble from a
// scattered cloud. Server HTML, reduced-motion visitors, and WebGL failures
// all get the static display-type wordmark instead.
export default function HeroWordmark() {
  const [ready, setReady] = useState(false);
  const [colors, setColors] = useState<ThemeColors | null>(null);
  const [sample, setSample] = useState<SampledWordmark | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<PointerState>({ x: 0, y: 0, active: false });

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

  // Rasterize + sample once the display font is really loaded; re-sample when
  // the container width changes meaningfully (not on mobile URL-bar jitter).
  useEffect(() => {
    if (!ready) return;
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let lastWidth = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const build = async () => {
      const width = container.clientWidth;
      if (!width || width === lastWidth) return;
      lastWidth = width;

      const family = getComputedStyle(container).fontFamily;
      try {
        await document.fonts.load(`${FONT_WEIGHT} 100px ${family}`);
      } catch {
        // Fall through — canvas will use the fallback font, still legible.
      }
      if (cancelled) return;

      const spacing = Math.min(18, Math.max(11, width / 62));
      setSample(
        sampleWordmark({
          text: WORDMARK,
          fontFamily: family,
          fontWeight: FONT_WEIGHT,
          targetWidth: Math.min(width * 0.88, 1280),
          spacing,
          layers: width < 720 ? 2 : 3,
        }),
      );
    };

    build();
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(build, 350);
    });
    ro.observe(container);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [ready]);

  // Pointer in text-plane coordinates (origin at container center, y up).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointerRef.current.x = e.clientX - rect.left - rect.width / 2;
      pointerRef.current.y = -(e.clientY - rect.top - rect.height / 2);
      pointerRef.current.active = true;
    };
    const onLeave = () => {
      pointerRef.current.active = false;
    };
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerdown", onMove);
    container.addEventListener("pointerleave", onLeave);
    container.addEventListener("pointercancel", onLeave);
    return () => {
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerdown", onMove);
      container.removeEventListener("pointerleave", onLeave);
      container.removeEventListener("pointercancel", onLeave);
    };
  }, []);

  const active = ready && colors !== null && sample !== null;

  return (
    <div
      ref={containerRef}
      className="font-display relative h-[52vh] min-h-[340px] w-full touch-pan-y select-none md:h-[62vh]"
    >
      {/* Static wordmark: the server-rendered face of the hero, replaced by
          the ball field once it's live. */}
      <p
        aria-hidden={active || undefined}
        className={`absolute inset-0 flex items-center justify-center font-semibold lowercase tracking-[-0.05em] text-ink-strong ${
          active ? "invisible" : ""
        }`}
        style={{ fontSize: "clamp(4rem, 13.5vw, 13rem)" }}
      >
        {WORDMARK}
      </p>

      {ready && colors && sample && (
        <CanvasBoundary>
          <Canvas
            aria-hidden
            tabIndex={-1}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            <FittedCamera />
            <BallField sample={sample} colors={colors} pointer={pointerRef} />
          </Canvas>
        </CanvasBoundary>
      )}
    </div>
  );
}

// Perspective camera fitted so 1 world unit == 1 CSS pixel on the z=0 plane:
// raster coordinates, sim coordinates, and pointer coordinates all agree.
function FittedCamera() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  useEffect(() => {
    const fov = 30;
    const dist = size.height / 2 / Math.tan(THREE.MathUtils.degToRad(fov / 2));
    camera.fov = fov;
    camera.position.set(0, 0, dist);
    camera.near = Math.max(1, dist - 900);
    camera.far = dist + 900;
    camera.updateProjectionMatrix();
  }, [camera, size.height]);
  return null;
}

function BallField({
  sample,
  colors,
  pointer,
}: {
  sample: SampledWordmark;
  colors: ThemeColors;
  pointer: React.RefObject<PointerState>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const lightPos = useRef(new THREE.Vector3(0, 120, 170));
  const sim = useMemo(() => new WordmarkSim(sample), [sample]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const dark = useMemo(() => {
    const c = new THREE.Color(colors.bg);
    return c.r + c.g + c.b < 1.5;
  }, [colors.bg]);

  // Per-ball colors: ink with slight tonal variety, plus sparse brand-accent
  // balls scattered through the crowd.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const ink = new THREE.Color(colors.ink);
    const bg = new THREE.Color(colors.bg);
    const accent = new THREE.Color(colors.accent);
    const c = new THREE.Color();
    const rand = seeded(4242);
    for (let i = 0; i < sim.n; i++) {
      if (rand() < 0.055) {
        c.copy(accent);
      } else {
        c.copy(ink).lerp(bg, rand() * 0.16);
      }
      mesh.setColorAt(i, c);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [colors, sim]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const p = pointer.current;

    sim.step(delta, p.x, p.y, p.active, DEFAULT_PARAMS);

    for (let i = 0; i < sim.n; i++) {
      dummy.position.set(sim.x[i], sim.y[i], sim.z[i]);
      dummy.scale.setScalar(sim.r[i]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    // The light chases the cursor; unattended it wanders a slow Lissajous
    // path so the relief never goes flat.
    const t = state.clock.elapsedTime;
    const targetX = p.active ? p.x : Math.sin(t * 0.22) * 320;
    const targetY = p.active ? p.y : Math.cos(t * 0.17) * 130;
    const k = 1 - Math.exp(-6 * delta);
    lightPos.current.x += (targetX - lightPos.current.x) * k;
    lightPos.current.y += (targetY - lightPos.current.y) * k;
    lightRef.current?.position.copy(lightPos.current);
  });

  return (
    <>
      <ambientLight intensity={dark ? 0.24 : 0.6} />
      <directionalLight
        position={[-260, 340, 420]}
        intensity={dark ? 0.35 : 0.8}
      />
      <pointLight
        ref={lightRef}
        position={[0, 120, 170]}
        intensity={dark ? 4.2 : 2.8}
        decay={0}
        color={dark ? "#dfe8ff" : "#ffffff"}
      />
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, sim.n]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial roughness={0.26} metalness={0.08} />
      </instancedMesh>
    </>
  );
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

function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
