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

// Decode budget. A wall of 1080p clips all decoding at once is what makes
// the hero feel heavy, so only the clips whose panels are near the viewport
// keep a decoder; the rest pause on their last frame (already invisible
// behind the edge vignette). Playback decisions run on their own slow tick,
// since play/pause churn at 60 Hz would cost more than it saves, and a clip
// holds its slot briefly after leaving so one hovering at the edge does not
// stutter. Panels beyond CULL_EDGE half-widths are fully off screen: a panel
// is clear of the edge once its center passes ~1.25.
const CULL_EDGE = 1.4;
const CULL_TICK_S = 0.25;
const CULL_HOLD_S = 1.2;
const MAX_DECODING = 12;
// Starting a decoder is the expensive moment (demux, buffer, first keyframe),
// so only a couple are started per tick. Scrolling back to the hero would
// otherwise restart a dozen at once and hitch the frame it lands on; instead
// the wall refills over about a second, behind the panels' own fade-in.
const RESUME_PER_TICK = 3;
// Grace period before a scrolled-away wall gives up its decoders. The frame
// loop is already stopped by then, so a few seconds of idle decoding is
// cheaper than the restart a quick scroll down and back would otherwise pay.
const PARK_DELAY_MS = 2500;
const FAR_EDGE = 1e6; // stand-in distance for a clip with no panel this frame

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
  onScreen,
}: {
  pointer: React.RefObject<{ x: number; y: number; active: boolean }>;
  drag: React.RefObject<WallDrag>;
  colors: ThemeColors;
  // False once the hero has scrolled away or the tab went to the background.
  // The frame loop is stopped then, so playback is parked from an effect.
  onScreen: boolean;
}) {
  const size = useThree((s) => s.size);
  const rigRef = useRef<THREE.Group>(null);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const state = useRef({
    offset: 0,
    speed: 0,
    wasDragging: false,
    started: false,
    cullTimer: 0,
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
        v.disableRemotePlayback = true;
        // Metadata only: fetching every clip up front stalls the whole page
        // on load. The decode budget below calls play() as panels approach,
        // which pulls each clip down roughly in the order it is needed.
        v.preload = "metadata";
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
  // with depth; each row draws from its own disjoint slice of the clip
  // pool, so no clip ever appears in more than one row.
  const layout = useMemo(() => {
    const t = wallLayoutTuner.read();
    const nearH = Math.min(460, Math.max(110, size.height * t.rowHeight));
    const yFracs = [t.yNear, t.yMid];
    const clipCount = SEEDANCE_SHOWCASE.length;
    const perRow = Math.floor(clipCount / ROW_COUNT);
    const extra = clipCount % ROW_COUNT;
    const panels: WallPanel[] = [];
    for (let i = 0; i < ROW_COUNT; i++) {
      // Remainder clips go to the deeper rows: their panels are smaller, so
      // they need more of them and repeat soonest without the bigger slice.
      const extraBefore = Math.max(0, i - (ROW_COUNT - extra));
      const rowStart = i * perRow + extraBefore;
      const rowClips = Math.max(1, perRow + (i >= ROW_COUNT - extra ? 1 : 0));
      const h = nearH * Math.pow(t.rowScale, i);
      const span = size.width * 1.5 + h * 2.6;
      let x = 0;
      let k = 0;
      const rowPanels: WallPanel[] = [];
      while (x < span) {
        const clip = (rowStart + (k % rowClips)) % clipCount;
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
      // The row is a loop, so the seam (last panel wrapping around to meet
      // the first) is an adjacency too. When the cycle length doesn't divide
      // the panel count, the seam can pair a clip with itself — bump the
      // last panel one step along the slice, which is distinct from both
      // neighbors whenever the slice holds 3+ clips.
      const last = rowPanels[rowPanels.length - 1];
      if (rowPanels.length > 1 && rowClips >= 3 && last.clip === rowPanels[0].clip) {
        const left = last.x0 - last.w / 2;
        last.clip = rowStart + ((last.clip - rowStart + 1) % rowClips);
        last.w = last.h * SEEDANCE_SHOWCASE[last.clip].aspect;
        last.x0 = left + last.w / 2;
        x = left + last.w + t.gap;
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

  // Per-clip decode bookkeeping, reused every frame so the budget allocates
  // nothing: closest panel edge, seconds since the clip last held a slot,
  // and a scratch permutation the budget sorts in place.
  const clipEdge = useMemo(
    () => new Float32Array(SEEDANCE_SHOWCASE.length).fill(FAR_EDGE),
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
    clipEdge.fill(FAR_EDGE);

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
      if (edge < clipEdge[c.clip]) clipEdge[c.clip] = edge;

      const ready = videos[c.clip].readyState >= 2 ? 1 : 0;
      videoAlpha[i] += (ready - videoAlpha[i]) * (1 - Math.exp(-3 * dt));
      const va = videoAlpha[i];

      // Depth dimming: dark theme crushes deep rows toward black (the bg);
      // light theme washes them toward the paper via opacity instead.
      const dim = dims[c.row];
      const mat = materials[i];
      if (dark) {
        // Fade the unloaded panel out with alpha, not toward black: clips
        // now load on demand, and an opaque black rectangle reads as a hole
        // in the wall against the dark background.
        mat.color.setScalar(dim * vig);
        mat.opacity = intro * va;
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

    st.cullTimer -= dt;
    if (st.cullTimer <= 0) {
      st.cullTimer = CULL_TICK_S;
      applyDecodeBudget(videos, clipEdge, clipIdle, clipOrder, CULL_TICK_S);
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

// Hand the scarce decoders to the clips nearest the viewport and pause the
// rest. Clips are ranked by their closest panel, so when the cap bites it is
// always the outermost panels that freeze: the ones the edge vignette has
// already dissolved. `elapsed` is the time since the previous call, not the
// frame delta: this runs on the cull tick, not every frame.
function applyDecodeBudget(
  videos: HTMLVideoElement[],
  clipEdge: Float32Array,
  clipIdle: Float32Array,
  clipOrder: number[],
  elapsed: number,
) {
  clipOrder.sort((a, b) => clipEdge[a] - clipEdge[b]);
  let started = 0;
  for (let rank = 0; rank < clipOrder.length; rank++) {
    const clip = clipOrder[rank];
    const v = videos[clip];
    if (rank < MAX_DECODING && clipEdge[clip] < CULL_EDGE) {
      clipIdle[clip] = 0;
      // Nearest clips are first in the ranking, so the stagger always
      // spends its budget on the panels closest to the middle of frame.
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
