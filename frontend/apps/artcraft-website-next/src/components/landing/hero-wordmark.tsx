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
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
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

// Studio reflections without any network fetch: three's procedural room,
// prefiltered once per WebGL context. This is what gives the dark "car
// paint" balls something to mirror.
function StudioEnvironment() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

const HALO_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const HALO_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uAlpha;
  void main() {
    float d = distance(vUv, vec2(0.5)) * 2.0;
    float a = pow(clamp(1.0 - d, 0.0, 1.0), 2.6);
    gl_FragColor = vec4(uColor, a * uAlpha);
  }
`;

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
  const haloRef = useRef<THREE.Mesh>(null);
  const lightPos = useRef(new THREE.Vector3(0, 120, 0));
  const sim = useMemo(() => new WordmarkSim(sample), [sample]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const dark = useMemo(() => {
    const c = new THREE.Color(colors.bg);
    return c.r + c.g + c.b < 1.5;
  }, [colors.bg]);

  // The halo sits behind the text plane, so the balls eclipse it: bodies go
  // to silhouette against the glow while their rims catch the back light.
  const haloMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: HALO_VERTEX,
        fragmentShader: HALO_FRAGMENT,
        uniforms: {
          uColor: {
            value: new THREE.Color(dark ? "#a8c4ff" : colors.accent),
          },
          uAlpha: { value: dark ? 0.5 : 0.14 },
        },
        transparent: true,
        depthWrite: false,
        blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
      }),
    [dark, colors.accent],
  );
  useEffect(() => () => haloMaterial.dispose(), [haloMaterial]);

  // Per-ball colors. Light theme: ink with slight tonal variety. Dark theme:
  // near-black lacquer, so shape comes from reflections and the back rim
  // instead of albedo. Both keep sparse brand-accent balls.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const bg = new THREE.Color(colors.bg);
    const ink = new THREE.Color(colors.ink);
    const accent = new THREE.Color(colors.accent);
    const base = dark
      ? bg.clone().lerp(ink, 0.10)
      : ink.clone();
    const c = new THREE.Color();
    const rand = seeded(4242);
    for (let i = 0; i < sim.n; i++) {
      if (rand() < 0.05) {
        c.copy(accent);
        if (dark) c.multiplyScalar(0.8);
      } else {
        c.copy(base).lerp(ink, rand() * (dark ? 0.08 : 0.16));
      }
      mesh.setColorAt(i, c);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [colors, sim, dark]);

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

    // The cursor light (and its halo) chase the pointer; unattended they
    // wander a slow Lissajous path so the relief never goes flat.
    const t = state.clock.elapsedTime;
    const targetX = p.active ? p.x : Math.sin(t * 0.22) * 320;
    const targetY = p.active ? p.y : Math.cos(t * 0.17) * 130;
    const k = 1 - Math.exp(-6 * delta);
    lightPos.current.x += (targetX - lightPos.current.x) * k;
    lightPos.current.y += (targetY - lightPos.current.y) * k;
    lightRef.current?.position.set(
      lightPos.current.x,
      lightPos.current.y,
      130,
    );
    haloRef.current?.position.set(
      lightPos.current.x,
      lightPos.current.y,
      -90,
    );

    // At rest the word sits in near-eclipse; approaching with the cursor
    // brings the light up to full.
    const light = lightRef.current;
    if (light) {
      const full = dark ? 58000 : 30000;
      const target = p.active ? full : full * 0.3;
      light.intensity += (target - light.intensity) * k;
    }
  });

  return (
    <>
      {/* No environment in dark mode: three applies scene.environment at
          effectively full strength here regardless of envMapIntensity, and
          any env flood washes the eclipse out. The rim lights are the only
          broad sources; the cursor light does the revealing. */}
      {!dark && <StudioEnvironment />}

      {dark ? (
        // Eclipse rig: almost no front light. A cool key from behind-above
        // rims the top edges, a faint counter-rim catches the lower-right,
        // and the cursor light does the actual revealing.
        <>
          <ambientLight intensity={0.05} />
          <directionalLight position={[-160, 340, -460]} intensity={2.2} color="#e9f1ff" />
          <directionalLight position={[430, -180, -380]} intensity={0.7} color="#7fa8e8" />
          <directionalLight position={[0, -60, 520]} intensity={0.06} />
        </>
      ) : (
        <>
          <ambientLight intensity={0.55} />
          <directionalLight position={[-260, 340, 420]} intensity={0.75} />
          <directionalLight position={[180, 260, -420]} intensity={0.5} color="#eef3ff" />
        </>
      )}

      {/* Cursor light: physical inverse-square falloff, so nearby balls are
          genuinely brighter than distant ones. Intensity is candela-scale
          because the scene is measured in pixels. */}
      <pointLight
        ref={lightRef}
        position={[0, 120, 130]}
        intensity={dark ? 42000 : 30000}
        decay={2}
        distance={900}
        color={dark ? "#d6e4ff" : "#ffffff"}
      />

      <mesh ref={haloRef} position={[0, 120, -90]} material={haloMaterial}>
        <planeGeometry args={[720, 720]} />
      </mesh>

      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, sim.n]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 24, 16]} />
        {dark ? (
          <meshPhysicalMaterial
            roughness={0.42}
            metalness={0.5}
            clearcoat={0.9}
            clearcoatRoughness={0.22}
            envMapIntensity={0.05}
          />
        ) : (
          <meshStandardMaterial
            roughness={0.3}
            metalness={0.15}
            envMapIntensity={0.55}
          />
        )}
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
