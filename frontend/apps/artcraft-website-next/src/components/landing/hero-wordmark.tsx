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
  sampleWordmarkGlyphs,
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
import SeedanceRail3D, { createRailDrag } from "./wordmark-rail";

const WORDMARK = "artcraft";
const FONT_WEIGHT = 700;

type PointerState = {
  x: number;
  y: number;
  active: boolean;
};

// The hero wordmark: "artcraft" as a hybrid of crisp type and particles —
// a solid Archivo letter core sits just behind a settled pile of small 3D
// balls (white pearls on dark, ink spheres on light). The core keeps the
// word instantly readable through every gap in the pile; the cursor is a
// point light and a push force, and shoving the pearls aside reveals the
// solid letterform beneath. On mount the balls assemble from a scattered
// cloud. Server HTML, reduced-motion visitors, and WebGL failures all get
// the static display-type wordmark instead.
export default function HeroWordmark() {
  const [ready, setReady] = useState(false);
  const [colors, setColors] = useState<ThemeColors | null>(null);
  const [sample, setSample] = useState<SampledWordmark | null>(null);
  const [core, setCore] = useState<SampledWordmark | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<PointerState>({ x: 0, y: 0, active: false });
  const railDragRef = useRef(createRailDrag());

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
      const targetWidth = Math.min(width * 0.88, 1280);
      setSample(
        sampleWordmark({
          text: WORDMARK,
          fontFamily: family,
          fontWeight: FONT_WEIGHT,
          targetWidth,
          spacing,
          formation,
        }),
      );
      // The crisp letter cores behind the pile. gapEm matches the ball
      // raster's per-glyph gap (0.05em) so the two layers align exactly.
      setCore(
        sampleWordmarkGlyphs({
          text: WORDMARK,
          fontFamily: family,
          fontWeight: FONT_WEIGHT,
          targetWidth,
          gapEm: 0.05,
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

  // Pointer in text-plane coordinates (origin at container center, y up),
  // plus drag bookkeeping for the orbit: pressing anywhere grabs the ring
  // of takes and spins it, while pointer movement keeps pushing the balls
  // — everything in the scene answers the same hand.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const dragLast = { x: 0, t: 0 };
    const onMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointerRef.current.x = e.clientX - rect.left - rect.width / 2;
      pointerRef.current.y = -(e.clientY - rect.top - rect.height / 2);
      pointerRef.current.active = true;
      const d = railDragRef.current;
      if (d.dragging) {
        const now = performance.now();
        const dx = e.clientX - dragLast.x;
        const dt = Math.max(8, now - dragLast.t) / 1000;
        d.dx += dx;
        d.vel = d.vel * 0.75 + (-dx / dt) * 0.25;
        dragLast.x = e.clientX;
        dragLast.t = now;
      }
    };
    const onDown = (e: PointerEvent) => {
      onMove(e);
      const d = railDragRef.current;
      d.dragging = true;
      d.dx = 0;
      d.vel = 0;
      dragLast.x = e.clientX;
      dragLast.t = performance.now();
      container.setPointerCapture(e.pointerId);
    };
    const onUp = () => {
      railDragRef.current.dragging = false;
    };
    const onLeave = () => {
      pointerRef.current.active = false;
      railDragRef.current.dragging = false;
    };
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerdown", onDown);
    container.addEventListener("pointerup", onUp);
    container.addEventListener("pointerleave", onLeave);
    container.addEventListener("pointercancel", onLeave);
    return () => {
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerdown", onDown);
      container.removeEventListener("pointerup", onUp);
      container.removeEventListener("pointerleave", onLeave);
      container.removeEventListener("pointercancel", onLeave);
    };
  }, []);

  const active = ready && colors !== null && sample !== null && core !== null;

  return (
    <div
      ref={containerRef}
      className="font-display relative h-svh min-h-[560px] w-full touch-pan-y select-none"
      style={{ fontStretch: "100%" }}
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

      {ready && colors && sample && core && (
        <CanvasBoundary>
          <Canvas
            aria-hidden
            tabIndex={-1}
            dpr={[1, 2]}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            <FittedCamera />
            <BallField
              sample={sample}
              core={core}
              colors={colors}
              pointer={pointerRef}
            />
            <SeedanceRail3D
              pointer={pointerRef}
              drag={railDragRef}
              colors={colors}
            />
          </Canvas>
        </CanvasBoundary>
      )}

      {active && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-1.5 flex items-center justify-between px-6 md:px-10"
        >
          <p className="hud-label text-faint">Rendered with Seedance 2.5</p>
          <p className="hud-label hidden text-faint sm:block">drag to spin</p>
        </div>
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
// prefiltered once per WebGL context. Light theme only — it gives the ink
// spheres their sheen.
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

function BallField({
  sample,
  core,
  colors,
  pointer,
}: {
  sample: SampledWordmark;
  core: SampledWordmark;
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
  // The word sits in the upper-middle of the canvas, clear of the orbit's
  // low front sweep. The mesh group is offset by `lift`; pointer coords are
  // shifted the opposite way before they reach the sim so the push force
  // stays aligned with what you see.
  const lift = useThree((s) => s.size.height) * 0.12;
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

  // Crisp letter cores: one lit sprite quad per glyph, sitting just behind
  // the pile. The silhouette reads through every gap between balls, and
  // pushing the pearls aside reveals the solid letterform.
  const coreGlyphs = core.glyphs ?? [];
  const coreTextures = useMemo(
    () =>
      coreGlyphs.map((g) => {
        const t = new THREE.CanvasTexture(g.canvas);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        return t;
      }),
    [coreGlyphs],
  );
  useEffect(
    () => () => coreTextures.forEach((t) => t.dispose()),
    [coreTextures],
  );
  const coreMats = useMemo(
    () =>
      coreTextures.map(
        (t) =>
          new THREE.MeshStandardMaterial({
            map: t,
            transparent: true,
            depthWrite: false,
            roughness: 0.55,
            metalness: 0,
          }),
      ),
    [coreTextures],
  );
  useEffect(() => () => coreMats.forEach((m) => m.dispose()), [coreMats]);
  useEffect(() => {
    const col = dark ? new THREE.Color("#ffffff") : new THREE.Color(colors.ink);
    coreMats.forEach((m) => m.color.copy(col));
  }, [coreMats, dark, colors.ink]);

  // A faint backing glow behind the text plane, following the cursor — just
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
          uAlpha: { value: dark ? 0.1 : 0.08 },
          uFalloff: { value: 2.6 },
        },
        transparent: true,
        depthWrite: false,
        blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
      }),
    [dark, colors.accent],
  );
  useEffect(() => () => haloMaterial.dispose(), [haloMaterial]);

  // Per-ball colors: pure white pearls on the dark theme, pure ink on light
  // — never gray; the lighting rig supplies all the shading. Sparse
  // brand-accent balls in both.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const accent = new THREE.Color(colors.accent);
    const base = dark
      ? new THREE.Color("#ffffff")
      : new THREE.Color(colors.ink);
    const rand = seeded(4242);
    for (let i = 0; i < sim.n; i++) {
      mesh.setColorAt(i, rand() < accentShare ? accent : base);
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

    sim.step(delta, p.x, p.y - lift, p.active, phys);

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
    const targetY = p.active ? p.y : lift + Math.cos(t * 0.17) * 130;
    const k = 1 - Math.exp(-6 * delta);
    lightPos.current.x += (targetX - lightPos.current.x) * k;
    lightPos.current.y += (targetY - lightPos.current.y) * k;
    lightRef.current?.position.set(
      lightPos.current.x,
      lightPos.current.y,
      lt.lightZ,
    );
    haloRef.current?.position.set(lightPos.current.x, lightPos.current.y, ht.z);

    // At rest the light idles dim; approaching with the cursor brings it up
    // to full.
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
          the white pearls read best under the rig + cursor light alone. */}
      {!dark && <StudioEnvironment />}

      {dark ? (
        // Lit rig for the white pearls: enough ambient to read at rest, a
        // cool key from front-above, a steel counter-rim from behind to
        // separate the pile from the dark bg, and the cursor light as the
        // interactive torch.
        <>
          <ambientLight ref={ambientRef} intensity={0.5} />
          <directionalLight
            ref={keyRef}
            position={[-240, 380, 420]}
            intensity={1.05}
            color="#eef3ff"
          />
          <directionalLight
            ref={counterRef}
            position={[430, -160, -380]}
            intensity={0.7}
            color="#9db8e8"
          />
          <directionalLight
            ref={fillRef}
            position={[0, -80, 520]}
            intensity={0.3}
          />
        </>
      ) : (
        <>
          <ambientLight ref={ambientRef} intensity={0.55} />
          <directionalLight
            ref={keyRef}
            position={[-260, 340, 420]}
            intensity={0.75}
          />
          <directionalLight
            position={[180, 260, -420]}
            intensity={0.5}
            color="#eef3ff"
          />
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

      {/* The settled-pile ball field — organic sizes, spheres. Dark theme
          renders them as glossy white pearls (clearcoat over a white body)
          so they stay really white while the rig and cursor light give them
          their shape. */}
      <group position={[0, lift, 0]}>
        <instancedMesh
          ref={meshRef}
          args={[undefined, undefined, sim.n]}
          frustumCulled={false}
        >
          <sphereGeometry args={[1, 24, 16]} />
          {dark ? (
            <meshPhysicalMaterial
              roughness={0.35}
              metalness={0}
              clearcoat={0.9}
              clearcoatRoughness={0.2}
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
      </group>
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
