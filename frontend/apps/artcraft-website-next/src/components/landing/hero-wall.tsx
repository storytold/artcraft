"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SEEDANCE_SHOWCASE } from "@/lib/landing-data";
import type { ThemeColors } from "@/lib/theme-colors";
import { useTunerStore } from "@/lib/tuner";
import {
  wallLayoutTuner,
  wallLookTuner,
  wallMotionTuner,
} from "./hero-tunables";

// The render wall: two film-strip rows of showcase clips forming one
// yawed, pitched wall behind the wordmark. Rows sit at stepped depths and
// drift sideways at speeds proportional to their depth — real parallax,
// like passing a wall of screens — and each row loops seamlessly (panels
// wrap around offscreen). Near row is full strength; deeper rows dim into
// the background so the type always owns the composition, and panels
// vignette out toward the screen edges.
//
// A drag anywhere throws the wall with momentum (the hero container feeds
// drag state in via the WallDrag ref, since the canvas itself is
// pointer-events: none); the pointer also tilts the whole wall a few
// degrees. Unattended it drifts at a slow walking pace.
//
// The scene is fitted 1 world unit == 1 CSS px at z=0, so layout below is
// in pixels. Each clip decodes once; panels showing the same clip share
// one VideoTexture.

// Drag state written by the hero container's pointer handlers and consumed
// here every frame.
export type WallDrag = {
  dragging: boolean;
  dx: number; // accumulated drag pixels since the wall last consumed them
  vel: number; // smoothed drag velocity, px/s
};

export function createWallDrag(): WallDrag {
  return { dragging: false, dx: 0, vel: 0 };
}

const ROW_COUNT = 2;
const FOV = 30; // must match FittedCamera in hero-wordmark.tsx

type WallPanel = {
  clip: number;
  w: number;
  h: number;
  x0: number; // resting position of the panel center along its row
  y: number;
  z: number;
  row: number;
  length: number; // total loop length of the row this panel rides
};

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export default function HeroWall({
  pointer,
  drag,
  colors,
}: {
  pointer: React.RefObject<{ x: number; y: number; active: boolean }>;
  drag: React.RefObject<WallDrag>;
  colors: ThemeColors;
}) {
  const size = useThree((s) => s.size);
  const rigRef = useRef<THREE.Group>(null);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const state = useRef({
    offset: 0,
    speed: 0,
    wasDragging: false,
    started: false,
  });
  const tilt = useRef({ x: 0, y: 0 });

  const dark = useMemo(() => {
    const c = new THREE.Color(colors.bg);
    return c.r + c.g + c.b < 1.5;
  }, [colors.bg]);

  // One <video> and one shared texture per clip.
  const videos = useMemo(
    () =>
      SEEDANCE_SHOWCASE.map((clip) => {
        const v = document.createElement("video");
        v.src = clip.src;
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        v.crossOrigin = "anonymous";
        v.preload = "auto";
        return v;
      }),
    [],
  );
  const textures = useMemo(
    () =>
      videos.map((v, i) => {
        const t = new THREE.VideoTexture(v);
        t.colorSpace = THREE.SRGBColorSpace;
        // Cover-fit the source into the panel plane (GL has no object-cover):
        // crop the longer axis via repeat/offset once dimensions are known.
        const fit = () => {
          const va = v.videoWidth / v.videoHeight || 16 / 9;
          const pa = SEEDANCE_SHOWCASE[i].aspect;
          if (va > pa) {
            t.repeat.set(pa / va, 1);
            t.offset.set((1 - pa / va) / 2, 0);
          } else {
            t.repeat.set(1, va / pa);
            t.offset.set(0, (1 - va / pa) / 2);
          }
        };
        if (v.readyState >= 1) fit();
        else v.addEventListener("loadedmetadata", fit, { once: true });
        return t;
      }),
    [videos],
  );
  // Video lifecycle is keyed to the videos/textures alone. Re-arm sources
  // on every run: React strict mode (and any remount) runs the cleanup,
  // which unloads the shared <video> elements the memo still holds.
  useEffect(() => {
    videos.forEach((v, i) => {
      if (!v.getAttribute("src")) {
        v.src = SEEDANCE_SHOWCASE[i].src;
        v.load();
      }
      v.play().catch(() => {});
    });
    return () => {
      textures.forEach((t) => t.dispose());
      videos.forEach((v) => {
        v.pause();
        v.removeAttribute("src");
        v.load();
      });
    };
  }, [videos, textures]);

  // Layout tunables change the wall's structure — debounce a rebuild.
  const [layoutVersion, setLayoutVersion] = useState(0);
  useEffect(() => {
    let last = JSON.stringify(wallLayoutTuner.read());
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useTunerStore.subscribe(() => {
      const now = JSON.stringify(wallLayoutTuner.read());
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

  // Wall structure: per row, panels are laid end to end with a uniform gap
  // until they cover the yawed viewport plus one panel of margin, so the
  // wrap-around teleport always happens offscreen. Rows shrink and recede
  // with depth; each starts its clip sequence at a different point so the
  // same footage never stacks vertically.
  const layout = useMemo(() => {
    const t = wallLayoutTuner.read();
    const nearH = Math.min(320, Math.max(110, size.height * t.rowHeight));
    const yFracs = [t.yNear, t.yMid];
    const panels: WallPanel[] = [];
    for (let i = 0; i < ROW_COUNT; i++) {
      const h = nearH * Math.pow(t.rowScale, i);
      const span = size.width * 1.5 + h * 2.6;
      let x = 0;
      let k = 0;
      const rowPanels: WallPanel[] = [];
      while (x < span) {
        const clip = (i * 3 + k) % SEEDANCE_SHOWCASE.length;
        const w = h * SEEDANCE_SHOWCASE[clip].aspect;
        rowPanels.push({
          clip,
          w,
          h,
          x0: x + w / 2,
          y: size.height * yFracs[i],
          z: -t.zStep * i,
          row: i,
          length: 0,
        });
        x += w + t.gap;
        k++;
      }
      for (const p of rowPanels) p.length = x;
      panels.push(...rowPanels);
    }
    const frames = panels.map(
      (p) => new THREE.EdgesGeometry(new THREE.PlaneGeometry(p.w, p.h)),
    );
    return { panels, frames };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, layoutVersion]);
  useEffect(() => () => layout.frames.forEach((f) => f.dispose()), [layout]);

  // Per-panel materials (panels share clip textures but dim and vignette
  // independently, so each needs its own color/opacity).
  const materials = useMemo(
    () =>
      layout.panels.map(
        (p) =>
          new THREE.MeshBasicMaterial({
            map: textures[p.clip],
            transparent: true,
            toneMapped: false,
          }),
      ),
    [textures, layout],
  );
  const frameMaterials = useMemo(
    () =>
      layout.panels.map(
        () => new THREE.LineBasicMaterial({ transparent: true }),
      ),
    [layout],
  );
  // Frame color follows the theme imperatively — recreating the materials
  // on a color change would churn the panel meshes for nothing.
  useEffect(() => {
    frameMaterials.forEach((m) => m.color.set(colors.lineStrong));
  }, [frameMaterials, colors.lineStrong]);
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);
  useEffect(
    () => () => frameMaterials.forEach((m) => m.dispose()),
    [frameMaterials],
  );

  // Per-panel video readiness, eased: until a clip has decodable frames its
  // panels stay as empty hairline skeletons, then the footage fades in —
  // no black rectangles and no pop-in on slow connections.
  const videoAlpha = useMemo(
    () => new Float32Array(layout.panels.length),
    [layout],
  );

  useFrame((st3, delta) => {
    const dt = Math.min(delta, 0.05);
    const st = state.current;
    const d = drag.current;
    const mt = wallMotionTuner.read();
    const lk = wallLookTuner.read();

    // Mount: the wall sweeps in fast and eases down to its walking pace.
    if (!st.started) {
      st.started = true;
      st.speed = mt.speed * mt.introBurst;
    }

    // Offset advances in near-row pixels; deeper rows consume it scaled by
    // their parallax factor, so a drag maps 1:1 to the near row's motion.
    if (d?.dragging) {
      st.offset -= d.dx;
      d.dx = 0;
      st.wasDragging = true;
    } else {
      if (st.wasDragging && d) {
        st.wasDragging = false;
        st.speed = Math.max(-mt.dragMax, Math.min(mt.dragMax, d.vel));
      }
      st.offset += st.speed * dt;
      st.speed += (mt.speed - st.speed) * (1 - Math.exp(-1.1 * dt));
    }

    // Pointer tilt, critically damped; unattended, a slow Lissajous drift
    // keeps the perspective alive.
    const p = pointer.current ?? { x: 0, y: 0, active: false };
    const t = st3.clock.elapsedTime;
    const nx = p.active
      ? p.x / (size.width / 2)
      : Math.sin(t * 0.13) * 0.35;
    const ny = p.active
      ? p.y / (size.height / 2)
      : Math.cos(t * 0.09) * 0.3;
    const k = 1 - Math.exp(-4 * dt);
    tilt.current.x += (nx - tilt.current.x) * k;
    tilt.current.y += (ny - tilt.current.y) * k;

    const yaw =
      THREE.MathUtils.degToRad(mt.yawDeg) + tilt.current.x * mt.parallax;
    const pitch =
      THREE.MathUtils.degToRad(mt.pitchDeg) - tilt.current.y * mt.parallax * 0.6;
    rigRef.current?.rotation.set(pitch, yaw, 0);

    const intro = smoothstep(0, 1, Math.min(1, t / 1.4));
    const dist = size.height / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const dims = [lk.dimNear, lk.dimMid];

    for (let i = 0; i < layout.panels.length; i++) {
      const g = groupRefs.current[i];
      if (!g) continue;
      const c = layout.panels[i];

      // Odd rows ride the shared offset mirrored, so the top strip slides
      // against the near one (and a drag counter-scrolls them).
      const f = Math.pow(mt.speedStep, c.row) * (c.row % 2 ? -1 : 1);
      let lx = (c.x0 - st.offset * f) % c.length;
      if (lx < 0) lx += c.length;
      lx -= c.length / 2;
      g.position.set(lx, c.y, c.z);

      // Screen-space vignette: project the panel center through the yaw and
      // fade panels out toward (and past) the viewport edges, so the wall
      // dissolves into the background instead of ending in a hard cut.
      const wx = cosY * lx + sinY * c.z;
      const wz = -sinY * lx + cosY * c.z;
      const projX = wx * (dist / (dist - wz));
      const edge = Math.abs(projX) / (size.width / 2);
      const vig = 1 - lk.edgeFade * smoothstep(0.72, 1.3, edge);

      const ready = videos[c.clip].readyState >= 2 ? 1 : 0;
      videoAlpha[i] += (ready - videoAlpha[i]) * (1 - Math.exp(-3 * dt));
      const va = videoAlpha[i];

      // Depth dimming: dark theme crushes deep rows toward black (the bg);
      // light theme washes them toward the paper via opacity instead.
      const dim = dims[c.row];
      const mat = materials[i];
      if (dark) {
        mat.color.setScalar(dim * vig * va);
        mat.opacity = intro;
      } else {
        // Light theme recedes via opacity toward the paper — but only for
        // depth: the near row keeps nearly full ink (sqrt softens its dim)
        // and the wash applies per-row, else everything goes pastel.
        mat.color.setScalar(1);
        mat.opacity =
          intro * Math.sqrt(dim) * vig * va * (1 - lk.washLight * c.row);
      }
      frameMaterials[i].opacity = lk.frameAlpha * vig * intro;
    }
  });

  return (
    <group ref={rigRef}>
      {layout.panels.map((c, i) => (
        <group
          key={i}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
          position={[0, c.y, c.z]}
        >
          <mesh material={materials[i]}>
            <planeGeometry args={[c.w, c.h]} />
          </mesh>
          {/* Hairline frame, matching the site's bordered viewport idiom. */}
          <lineSegments geometry={layout.frames[i]} material={frameMaterials[i]} />
        </group>
      ))}
    </group>
  );
}
