"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SEEDANCE_SHOWCASE } from "@/lib/landing-data";
import type { ThemeColors } from "@/lib/theme-colors";

// Seedance takes orbiting the wordmark: video planes ride a tilted,
// jittered ellipse woven through the block text's space. Behind the word
// they hang small, high, and faded; past its flanks they cross mid-depth;
// in front they sweep low and large — real perspective does the scaling,
// and the blocks occlude the far side of the orbit, which is what makes
// the two read as one object. A drag anywhere spins the orbit with
// momentum (the container feeds drag state in via the RailDrag ref, since
// the canvas itself is pointer-events: none); otherwise it turns at a slow
// walking pace.
//
// The scene is fitted 1 world unit == 1 CSS px at z=0, so layout below is
// in pixels. Each clip decodes once — the orbit shows the clip set twice,
// and duplicate cards share the same VideoTexture.

// Drag state written by the hero container's pointer handlers and consumed
// here every frame.
export type RailDrag = {
  dragging: boolean;
  dx: number; // accumulated drag pixels since the orbit last consumed them
  vel: number; // smoothed drag velocity, px/s
};

export function createRailDrag(): RailDrag {
  return { dragging: false, dx: 0, vel: 0 };
}

const LAPS = 2; // the clip set appears twice around the ring
const BASE_SPEED = 60; // px/s along the perimeter — one lap ≈ 1 minute
const MAX_DRAG_SPEED = 2400; // px/s
const TILT_RANGE = 300; // px of cursor influence around a front card
const MAX_TILT = 0.18; // rad extra face-the-cursor tilt

// Deterministic per-card jitter (no Math.random — stable across renders).
function hash(i: number): number {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

type OrbitCard = {
  clip: number;
  w: number;
  h: number;
  s0: number; // arc-length position of the card center on the ring
  yJitter: number;
  radJitter: number;
  rotZ: number; // static "pinned crooked" roll
  bobPhase: number;
};

export default function SeedanceRail3D({
  pointer,
  drag,
  colors,
}: {
  pointer: React.RefObject<{ x: number; y: number; active: boolean }>;
  drag: React.RefObject<RailDrag>;
  colors: ThemeColors;
}) {
  const size = useThree((s) => s.size);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const state = useRef({ offset: 0, speed: BASE_SPEED, wasDragging: false });

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
        // Cover-fit the source into the card plane (GL has no object-cover):
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
  // Per-card materials (cards share textures but fade independently with
  // orbit depth, so each needs its own opacity).
  const cardCount = SEEDANCE_SHOWCASE.length * LAPS;
  const materials = useMemo(
    () =>
      Array.from({ length: cardCount }, (_, k) => {
        const m = new THREE.MeshBasicMaterial({
          map: textures[k % SEEDANCE_SHOWCASE.length],
          transparent: true,
          toneMapped: false,
        });
        return m;
      }),
    [textures, cardCount],
  );
  const frameMaterials = useMemo(
    () =>
      Array.from(
        { length: cardCount },
        () => new THREE.LineBasicMaterial({ transparent: true }),
      ),
    [cardCount],
  );
  // Frame color follows the theme imperatively — recreating the materials
  // on a color change would cascade into the shared-texture cleanup below.
  useEffect(() => {
    frameMaterials.forEach((m) => m.color.set(colors.lineStrong));
  }, [frameMaterials, colors.lineStrong]);
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);
  useEffect(
    () => () => frameMaterials.forEach((m) => m.dispose()),
    [frameMaterials],
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

  // Orbit geometry: a wide ellipse tilted through the word — its width just
  // grazes the wordmark's flanks so side cards weave past the letters.
  // Cards are laid out and animated by ARC LENGTH, not angle: equal angles
  // bunch on an ellipse's flat stretches and ignore card widths, which is
  // what produced uneven gaps. One shared gap absorbs the leftover
  // perimeter so the loop closes with no blank stretch.
  const layout = useMemo(() => {
    const cardH = Math.min(170, Math.max(90, size.height * 0.16));
    const ringX = Math.min(size.width * 0.47, 820);
    const ringZ = 430;

    // Cumulative arc-length table for the ellipse, plus its inverse
    // (arc position → parametric angle).
    const M = 720;
    const arc = new Float32Array(M + 1);
    let px = 0;
    let pz = ringZ;
    for (let j = 1; j <= M; j++) {
      const a = (j / M) * Math.PI * 2;
      const x = Math.sin(a) * ringX;
      const z = Math.cos(a) * ringZ;
      arc[j] = arc[j - 1] + Math.hypot(x - px, z - pz);
      px = x;
      pz = z;
    }
    const perimeter = arc[M];
    const angleAt = (s: number) => {
      let sw = s % perimeter;
      if (sw < 0) sw += perimeter;
      let lo = 0;
      let hi = M;
      while (lo + 1 < hi) {
        const mid = (lo + hi) >> 1;
        if (arc[mid] <= sw) lo = mid;
        else hi = mid;
      }
      const span = arc[lo + 1] - arc[lo] || 1;
      return ((lo + (sw - arc[lo]) / span) / M) * Math.PI * 2;
    };

    // Size every card, then space the set evenly along the perimeter.
    const sized: { clip: number; w: number; h: number }[] = [];
    let sumW = 0;
    for (let k = 0; k < cardCount; k++) {
      const clip = k % SEEDANCE_SHOWCASE.length;
      const h = Math.round(cardH * (0.85 + hash(k + 40) * 0.4));
      const w = Math.round(h * SEEDANCE_SHOWCASE[clip].aspect);
      sumW += w;
      sized.push({ clip, w, h });
    }
    const gap = Math.max(14, (perimeter - sumW) / cardCount);
    const cards: OrbitCard[] = [];
    let sPos = 0;
    sized.forEach((c, k) => {
      cards.push({
        ...c,
        s0: sPos + c.w / 2,
        yJitter: (hash(k + 200) - 0.5) * 30,
        radJitter: (hash(k + 120) - 0.5) * 40,
        rotZ: (hash(k + 80) - 0.5) * 0.08,
        bobPhase: hash(k + 240) * Math.PI * 2,
      });
      sPos += c.w + gap;
    });

    const frames = cards.map(
      (c) => new THREE.EdgesGeometry(new THREE.PlaneGeometry(c.w, c.h)),
    );
    // A steeply tilted, diagonally inclined ring: the front sweeps low and
    // close, the far side climbs high into the empty air above the word,
    // and the side tilt breaks the symmetry so the orbit reads as a loose
    // spiral rather than a carousel.
    const swing = size.height * 0.22;
    const sideTilt = size.height * 0.05;
    const centerY = size.height * 0.04;
    return { cards, frames, swing, sideTilt, centerY, ringX, ringZ, angleAt };
  }, [size.width, size.height, cardCount]);
  useEffect(() => () => layout.frames.forEach((f) => f.dispose()), [layout]);

  useFrame((st3, delta) => {
    const dt = Math.min(delta, 0.05);
    const st = state.current;
    const d = drag.current;

    // Offset advances in perimeter pixels, so a drag maps 1:1 to card
    // motion at the front of the ring and spacing stays constant all the
    // way around.
    if (d?.dragging) {
      st.offset -= d.dx;
      d.dx = 0;
      st.wasDragging = true;
    } else {
      if (st.wasDragging && d) {
        st.wasDragging = false;
        st.speed = Math.max(-MAX_DRAG_SPEED, Math.min(MAX_DRAG_SPEED, -d.vel));
      }
      st.offset += st.speed * dt;
      st.speed += (BASE_SPEED - st.speed) * (1 - Math.exp(-1.1 * dt));
    }

    const p = pointer.current ?? { x: 0, y: 0, active: false };
    const k = 1 - Math.exp(-9 * dt);
    const t = st3.clock.elapsedTime;
    const { cards, swing, sideTilt, centerY, ringX, ringZ, angleAt } = layout;
    for (let i = 0; i < cards.length; i++) {
      const g = groupRefs.current[i];
      if (!g) continue;
      const c = cards[i];
      const a = angleAt(c.s0 + st.offset);
      const sinA = Math.sin(a);
      const cosA = Math.cos(a);

      // Tilted ellipse: front (cosA=1) is low and near, back is high and
      // far, and the sinA term inclines the ring diagonally. A slow
      // individual bob keeps the pile from ever going static.
      const x = sinA * (ringX + c.radJitter);
      const y =
        centerY -
        cosA * swing +
        sinA * sideTilt +
        c.yJitter +
        Math.sin(t * 0.6 + c.bobPhase) * 5;
      const z = cosA * (ringZ + c.radJitter * 0.5);

      // Carousel facing: side cards angle along the orbit's tangent; near
      // the cursor, front cards add a face-the-pointer tilt.
      let ry = sinA * 0.45;
      if (p.active && z > 0) {
        const dx = x - p.x;
        const adx = Math.abs(dx);
        if (adx < TILT_RANGE) {
          ry += (dx / TILT_RANGE) * MAX_TILT * (z / ringZ);
        }
      }

      g.position.set(x, y, z);
      g.rotation.z = c.rotZ;
      g.rotation.y += (ry - g.rotation.y) * k;

      // Depth fade, steeper than linear: front cards are full-strength,
      // anything behind the word sinks fast toward the page bg so the
      // letterforms always dominate the composition.
      const depth = (z / ringZ + 1) / 2; // 0 back … 1 front
      const op = 0.15 + 0.85 * Math.pow(depth, 1.6);
      materials[i].opacity = op;
      frameMaterials[i].opacity = op * 0.9;
    }
  });

  return (
    <group>
      {layout.cards.map((c, i) => (
        <group
          key={i}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
          position={[
            Math.sin(layout.angleAt(c.s0)) * layout.ringX,
            layout.centerY,
            Math.cos(layout.angleAt(c.s0)) * layout.ringZ,
          ]}
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
