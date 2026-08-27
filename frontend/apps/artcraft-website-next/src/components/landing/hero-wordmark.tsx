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
import { useTunerStore } from "@/lib/tuner";
import {
  sampleWordmark,
  WordmarkSim,
  type SampledWordmark,
} from "./wordmark-sim";
import {
  formationTuner,
  physicsTuner,
  lightTuner,
  materialTuner,
  haloTuner,
} from "./hero-tunables";

const WORDMARK = "artcraft";
const FONT_WEIGHT = 700;

type PointerState = {
  x: number;
  y: number;
  active: boolean;
};

// The hero wordmark: "artcraft" built from small axis-aligned blocks — the
// same primitives you block a scene out with before the AI render. The cursor
// is both a point light and a push force — the blocks part around it, pop
// toward the viewer, and rejoin on their springs. On mount they assemble from
// a scattered cloud. Server HTML, reduced-motion visitors, and WebGL failures
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
  // the container width changes meaningfully (not on mobile URL-bar jitter)
  // or when a Formation tunable moves in the dev tuner.
  useEffect(() => {
    if (!ready) return;
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let lastWidth = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const build = async (force = false) => {
      const width = container.clientWidth;
      if (!width || (!force && width === lastWidth)) return;
      lastWidth = width;

      const family = getComputedStyle(container).fontFamily;
      try {
        await document.fonts.load(`${FONT_WEIGHT} 100px ${family}`);
      } catch {
        // Fall through — canvas will use the fallback font, still legible.
      }
      if (cancelled) return;

      const { ballScale, ...formation } = formationTuner.read();
      const spacing = Math.min(18, Math.max(11, width / 62)) * ballScale;
      setSample(
        sampleWordmark({
          text: WORDMARK,
          fontFamily: family,
          fontWeight: FONT_WEIGHT,
          targetWidth: Math.min(width * 0.88, 1280),
          spacing,
          formation,
        }),
      );
    };

    build();
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(build, 350);
    });
    ro.observe(container);

    // Formation tunables change the arrangement itself — debounce a rebuild.
    let lastFormation = JSON.stringify(formationTuner.read());
    const unsubscribe = useTunerStore.subscribe(() => {
      const now = JSON.stringify(formationTuner.read());
      if (now === lastFormation) return;
      lastFormation = now;
      clearTimeout(timer);
      timer = setTimeout(() => build(true), 250);
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      ro.disconnect();
      unsubscribe();
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
            <BlockField sample={sample} colors={colors} pointer={pointerRef} />
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
// prefiltered once per WebGL context. Light theme only — it gives the matte
// ink blocks a hint of sheen on their top faces.
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
  uniform float uFalloff;
  void main() {
    float d = distance(vUv, vec2(0.5)) * 2.0;
    float a = pow(clamp(1.0 - d, 0.0, 1.0), uFalloff);
    gl_FragColor = vec4(uColor, a * uAlpha);
  }
`;

function BlockField({
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
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const counterRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const lightPos = useRef(new THREE.Vector3(0, 120, 0));
  const sim = useMemo(
    () => new WordmarkSim(sample, physicsTuner.read().scatter),
    [sample],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  // Reactive so recoloring reruns when the accent share slider moves.
  const accentShare = useTunerStore(
    (s) => s.values["material.accentShare"] ?? 0.05,
  );

  const dark = useMemo(() => {
    const c = new THREE.Color(colors.bg);
    return c.r + c.g + c.b < 1.5;
  }, [colors.bg]);

  // A faint backing glow behind the text plane, following the cursor. With
  // the lit blocks it stays a whisper (see haloTuner alpha defaults) — just
  // enough halation to mark where the torch is pointed.
  const haloMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: HALO_VERTEX,
        fragmentShader: HALO_FRAGMENT,
        uniforms: {
          uColor: {
            value: new THREE.Color(dark ? "#a8c4ff" : colors.accent),
          },
          uAlpha: { value: dark ? 0.1 : 0.14 },
          uFalloff: { value: 2.6 },
        },
        transparent: true,
        depthWrite: false,
        blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
      }),
    [dark, colors.accent],
  );
  useEffect(() => () => haloMaterial.dispose(), [haloMaterial]);

  // Per-block colors. Light theme: ink blocks on paper. Dark theme: light
  // concrete-toned blocks on the near-black terminal bg — clearly visible at
  // rest, with per-block tonal variety so the pile reads as material, not a
  // flat fill. Both keep sparse brand-accent blocks.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const bg = new THREE.Color(colors.bg);
    const ink = new THREE.Color(colors.ink);
    const accent = new THREE.Color(colors.accent);
    const base = dark
      ? ink.clone().lerp(bg, 0.16)
      : ink.clone();
    const c = new THREE.Color();
    const rand = seeded(4242);
    for (let i = 0; i < sim.n; i++) {
      if (rand() < accentShare) {
        c.copy(accent);
      } else {
        c.copy(base).lerp(bg, rand() * (dark ? 0.3 : 0.16));
      }
      mesh.setColorAt(i, c);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [colors, sim, dark, accentShare]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const p = pointer.current;

    // Live tuner values — read every frame so slider changes apply instantly.
    const phys = physicsTuner.read();
    const lt = lightTuner.read();
    const mt = materialTuner.read();
    const ht = haloTuner.read();

    sim.step(delta, p.x, p.y, p.active, phys);

    // Box edge = collision radius × blockFill: below 2 leaves hairline seams
    // between neighbors (mosaic), above it lets corners bite in (rubble).
    const edge = mt.blockFill;
    for (let i = 0; i < sim.n; i++) {
      dummy.position.set(sim.x[i], sim.y[i], sim.z[i]);
      dummy.scale.setScalar(sim.r[i] * edge);
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
      lt.lightZ,
    );
    haloRef.current?.position.set(
      lightPos.current.x,
      lightPos.current.y,
      ht.z,
    );

    // At rest the word sits in near-eclipse; approaching with the cursor
    // brings the light up to full.
    const light = lightRef.current;
    if (light) {
      light.distance = lt.lightRange;
      const full = dark ? lt.intensityDark : lt.intensityLight;
      const target = p.active ? full : full * lt.idleDim;
      light.intensity += (target - light.intensity) * k;
    }

    // Rig + material + halo bindings.
    if (ambientRef.current) {
      ambientRef.current.intensity = dark ? lt.ambientDark : lt.ambientLight;
    }
    if (keyRef.current) {
      keyRef.current.intensity = dark ? lt.keyIntensity : lt.dirLight;
    }
    if (counterRef.current) counterRef.current.intensity = lt.counterIntensity;
    if (fillRef.current) fillRef.current.intensity = lt.frontFill;

    const mat = mesh.material as THREE.MeshPhysicalMaterial &
      THREE.MeshStandardMaterial;
    if (dark) {
      mat.roughness = mt.roughnessDark;
      mat.metalness = mt.metalnessDark;
      mat.clearcoat = mt.clearcoat;
      mat.clearcoatRoughness = mt.clearcoatRoughness;
    } else {
      mat.roughness = mt.roughnessLight;
      mat.metalness = mt.metalnessLight;
      mat.envMapIntensity = mt.envLight;
    }

    haloMaterial.uniforms.uAlpha.value = dark ? ht.alphaDark : ht.alphaLight;
    haloMaterial.uniforms.uFalloff.value = ht.falloff;
    haloRef.current?.scale.setScalar(ht.size / 720);
  });

  return (
    <>
      {/* No environment in dark mode: three applies scene.environment at
          effectively full strength here regardless of envMapIntensity, and
          matte blocks don't need reflections — directional faces carry the
          form on their own. */}
      {!dark && <StudioEnvironment />}

      {dark ? (
        // Lit rig for the light blocks: a cool key from front-above gives
        // every top face a bright plane and every side face a step down —
        // the faceted read that makes the voxels legible at rest. A steel
        // counter-rim from behind separates the pile from the black bg, and
        // the cursor light stays the interactive torch.
        <>
          <ambientLight ref={ambientRef} intensity={0.4} />
          <directionalLight ref={keyRef} position={[-240, 380, 420]} intensity={1.05} color="#eef3ff" />
          <directionalLight ref={counterRef} position={[430, -160, -380]} intensity={0.7} color="#9db8e8" />
          <directionalLight ref={fillRef} position={[0, -80, 520]} intensity={0.3} />
        </>
      ) : (
        <>
          <ambientLight ref={ambientRef} intensity={0.55} />
          <directionalLight ref={keyRef} position={[-260, 340, 420]} intensity={0.75} />
          <directionalLight position={[180, 260, -420]} intensity={0.5} color="#eef3ff" />
        </>
      )}

      {/* Cursor light: physical inverse-square falloff, so nearby balls are
          genuinely brighter than distant ones. Intensity is candela-scale
          because the scene is measured in pixels. */}
      <pointLight
        ref={lightRef}
        position={[0, 120, 130]}
        intensity={30000}
        decay={2}
        distance={900}
        color={dark ? "#d6e4ff" : "#ffffff"}
      />

      <mesh ref={haloRef} position={[0, 120, -90]} material={haloMaterial}>
        <planeGeometry args={[720, 720]} />
      </mesh>

      {/* Axis-aligned unit cubes — the brutalist unit. Per-face normals give
          each block three distinct light planes; no smoothing, no gloss. */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, sim.n]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        {dark ? (
          <meshPhysicalMaterial
            roughness={0.8}
            metalness={0}
            clearcoat={0}
            clearcoatRoughness={0.25}
            envMapIntensity={0.05}
          />
        ) : (
          <meshStandardMaterial
            roughness={0.55}
            metalness={0.05}
            envMapIntensity={0.45}
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
