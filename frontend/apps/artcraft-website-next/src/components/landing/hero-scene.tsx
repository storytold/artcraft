"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import * as THREE from "three";

// The "blocking" side of the hero comparator: a film set sketched in
// wireframe — backdrop, blocked props, a character stand-in, and a virtual
// camera gizmo aimed at the set. Everything a director sees before the
// AI render exists. Colors come from the live theme tokens via props.
export type SceneColors = {
  line: string;
  lineStrong: string;
  accent: string;
  ink: string;
};

export default function HeroScene({
  colors,
  pointer,
}: {
  colors: SceneColors;
  // Normalized pointer position over the hero figure, -1..1 on both axes.
  // Mutated externally; read per frame without re-rendering React.
  pointer: React.RefObject<{ x: number; y: number }>;
}) {
  return (
    <Canvas
      aria-hidden
      tabIndex={-1}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 34, position: [0, 2.1, 9.2], near: 0.1, far: 60 }}
      style={{ pointerEvents: "none" }}
    >
      <Rig pointer={pointer}>
        <Grid
          position={[0, 0, 0]}
          args={[30, 30]}
          cellSize={0.6}
          cellThickness={0.6}
          cellColor={colors.line}
          sectionSize={3}
          sectionThickness={1}
          sectionColor={colors.lineStrong}
          fadeDistance={26}
          fadeStrength={2.4}
          infiniteGrid
        />
        <Set colors={colors} />
      </Rig>
    </Canvas>
  );
}

// Slow establishing drift plus pointer parallax, critically damped so it
// never overshoots or jitters.
function Rig({
  pointer,
  children,
}: {
  pointer: React.RefObject<{ x: number; y: number }>;
  children: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const current = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const target = pointer.current ?? { x: 0, y: 0 };
    const k = 1 - Math.exp(-4 * delta);
    current.current.x += (target.x - current.current.x) * k;
    current.current.y += (target.y - current.current.y) * k;

    const t = state.clock.elapsedTime;
    g.rotation.y = Math.sin(t * 0.08) * 0.1 + current.current.x * 0.14;
    g.rotation.x = current.current.y * 0.05;
  });

  return <group ref={group}>{children}</group>;
}

function Set({ colors }: { colors: SceneColors }) {
  return (
    <group>
      {/* Backdrop flat */}
      <Wire geometry="box" args={[8.4, 4.6, 0.12]} position={[0, 2.3, -3.6]} color={colors.line} />
      {/* Blocked props */}
      <Wire geometry="box" args={[1.5, 1.5, 1.5]} position={[-2.5, 0.75, -0.8]} color={colors.lineStrong} />
      <Wire geometry="box" args={[1, 1, 1]} position={[-1.35, 0.5, 0.6]} color={colors.line} />
      <Wire geometry="cylinder" args={[0.55, 0.55, 1.4, 12]} position={[2.6, 0.7, -1.2]} color={colors.lineStrong} />
      <Wire geometry="sphere" args={[0.62, 16, 12]} position={[1.5, 0.62, 0.9]} color={colors.line} />
      {/* Character stand-in */}
      <Wire geometry="capsule" args={[0.34, 1.05, 4, 10]} position={[0.1, 0.86, -0.2]} color={colors.accent} />
      {/* Virtual camera gizmo, aimed back at the set */}
      <CameraGizmo colors={colors} />
    </group>
  );
}

const GEOMETRIES = {
  box: THREE.BoxGeometry,
  cylinder: THREE.CylinderGeometry,
  sphere: THREE.SphereGeometry,
  capsule: THREE.CapsuleGeometry,
} as const;

// Edge-line rendering (not triangle wireframe) keeps the blocking sketch
// legible: silhouettes and creases only, like a viewport's wireframe mode.
function Wire({
  geometry,
  args,
  position,
  color,
  rotation,
}: {
  geometry: keyof typeof GEOMETRIES;
  args: number[];
  position: [number, number, number];
  color: string;
  rotation?: [number, number, number];
}) {
  const edges = useMemo(() => {
    const Ctor = GEOMETRIES[geometry] as new (
      ...a: number[]
    ) => THREE.BufferGeometry;
    const geo = new Ctor(...args);
    const result = new THREE.EdgesGeometry(geo, 18);
    geo.dispose();
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry, ...args]);

  return (
    <lineSegments geometry={edges} position={position} rotation={rotation}>
      <lineBasicMaterial color={color} transparent opacity={0.9} />
    </lineSegments>
  );
}

function CameraGizmo({ colors }: { colors: SceneColors }) {
  return (
    <group position={[3.4, 1.5, 3]} rotation={[0, Math.PI / 4.6, 0]}>
      <Wire geometry="box" args={[0.55, 0.42, 0.8]} position={[0, 0, 0]} color={colors.accent} />
      <Wire
        geometry="cylinder"
        args={[0.34, 0.06, 0.55, 4]}
        position={[0, 0, -0.68]}
        rotation={[-Math.PI / 2, Math.PI / 4, 0]}
        color={colors.accent}
      />
    </group>
  );
}
