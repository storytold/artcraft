"use client";

import { useEffect, useRef, useState } from "react";
import { SEEDANCE_SHOWCASE, type SeedanceClip } from "@/lib/landing-data";

// The Seedance rail: sample renders streaming under the block wordmark as a
// draggable marquee. Same interaction language as the blocks above — the
// cursor pushes the word apart, and down here it tilts and lifts the takes
// it passes over. DOM + perspective transforms rather than a second WebGL
// canvas: video playback needs no CORS, costs no per-frame texture uploads,
// and flat rectangles gain nothing from real GL.
//
// Cards are absolutely positioned; a single rAF loop advances one scroll
// offset, wraps each card around the track modulo its total width (so clips
// aren't duplicated — 7 videos, not 14), and eases per-card tilt toward the
// cursor. Dragging scrubs the offset directly and hands its velocity back to
// the auto-scroll on release, which decays to walking pace.

// Non-uniform card geometry: video-area heights and baseline offsets cycle
// through these, like takes pinned at different heights on a wall.
const HEIGHTS = [190, 232, 158, 214, 172, 244, 196];
const OFFSETS = [10, -18, 24, -8, 16, -24, 4];
const CAPTION_H = 30; // caption row, including its top hairline
const GAP = 16;
const BAND_H = 330;
const BASE_SPEED = 26; // px/s auto-scroll
const MAX_DRAG_SPEED = 2400;
const TILT_RANGE = 300; // px of cursor influence around a card center
const MAX_TILT_Y = 9; // deg
const MAX_TILT_X = 5; // deg

type CardGeom = {
  w: number;
  h: number;
  top: number;
  base: number; // resting x in track coordinates
};

const GEOM: CardGeom[] = (() => {
  let x = 0;
  return SEEDANCE_SHOWCASE.map((clip, i) => {
    const h = HEIGHTS[i % HEIGHTS.length];
    const w = Math.round(h * clip.aspect);
    const top = (BAND_H - (h + CAPTION_H)) / 2 + OFFSETS[i % OFFSETS.length];
    const base = x;
    x += w + GAP;
    return { w, h, top, base };
  });
})();

const TOTAL = GEOM.reduce((sum, g) => sum + g.w + GAP, 0);
// Wrap point: a card leaves through this margin past the left edge before
// re-entering on the right, so the jump is never visible.
const WRAP_PAD = Math.max(...GEOM.map((g) => g.w)) + GAP;

export default function HeroSeedanceRail() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const pointer = { x: 0, y: 0, in: false };
    const drag = { on: false, lastX: 0, lastT: 0, vel: 0 };
    let offset = 0;
    let speed = BASE_SPEED;
    let visible = true;
    let raf = 0;
    let last = performance.now();
    const n = GEOM.length;
    // Eased per-card state: rotateY, rotateX, translateZ, scale-1.
    const tilt = new Float32Array(n * 4);

    const toLocal = (e: PointerEvent) => {
      const rect = viewport.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };

    const onEnter = (e: PointerEvent) => {
      pointer.in = true;
      toLocal(e);
    };
    const onMove = (e: PointerEvent) => {
      pointer.in = true;
      toLocal(e);
      if (!drag.on) return;
      const now = performance.now();
      const dx = e.clientX - drag.lastX;
      const dt = Math.max(8, now - drag.lastT) / 1000;
      offset -= dx;
      drag.vel = drag.vel * 0.75 + (-dx / dt) * 0.25;
      drag.lastX = e.clientX;
      drag.lastT = now;
    };
    const onLeave = () => {
      pointer.in = false;
    };
    const onDown = (e: PointerEvent) => {
      drag.on = true;
      drag.vel = 0;
      drag.lastX = e.clientX;
      drag.lastT = performance.now();
      viewport.setPointerCapture(e.pointerId);
    };
    const endDrag = () => {
      if (!drag.on) return;
      drag.on = false;
      speed = Math.max(-MAX_DRAG_SPEED, Math.min(MAX_DRAG_SPEED, drag.vel));
    };

    viewport.addEventListener("pointerenter", onEnter);
    viewport.addEventListener("pointermove", onMove);
    viewport.addEventListener("pointerleave", onLeave);
    viewport.addEventListener("pointerdown", onDown);
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    // Offscreen the rail costs nothing: videos pause and the loop idles.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      viewport.querySelectorAll("video").forEach((el) => {
        if (visible) el.play().catch(() => {});
        else el.pause();
      });
      if (visible) last = performance.now();
    });
    io.observe(viewport);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (!drag.on) {
        offset += speed * dt;
        speed += (BASE_SPEED - speed) * (1 - Math.exp(-1.1 * dt));
      }

      const k = 1 - Math.exp(-9 * dt);
      for (let i = 0; i < n; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const g = GEOM[i];
        const x = ((((g.base - offset) % TOTAL) + TOTAL) % TOTAL) - WRAP_PAD;

        let ry = 0;
        let rx = 0;
        let z = 0;
        let s = 0;
        if (pointer.in) {
          const dx = x + g.w / 2 - pointer.x;
          const adx = Math.abs(dx);
          if (adx < TILT_RANGE) {
            const f = 1 - adx / TILT_RANGE;
            ry = (dx / TILT_RANGE) * MAX_TILT_Y;
            const dy = g.top + (g.h + CAPTION_H) / 2 - pointer.y;
            rx = -Math.max(-1, Math.min(1, dy / 160)) * MAX_TILT_X;
            z = 34 * f * f;
            s = 0.04 * f * f;
          }
        }
        const t = i * 4;
        tilt[t] += (ry - tilt[t]) * k;
        tilt[t + 1] += (rx - tilt[t + 1]) * k;
        tilt[t + 2] += (z - tilt[t + 2]) * k;
        tilt[t + 3] += (s - tilt[t + 3]) * k;

        el.style.transform =
          `translate3d(${x.toFixed(2)}px, 0, ${tilt[t + 2].toFixed(2)}px) ` +
          `rotateX(${tilt[t + 1].toFixed(2)}deg) ` +
          `rotateY(${tilt[t].toFixed(2)}deg) ` +
          `scale(${(1 + tilt[t + 3]).toFixed(4)})`;
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      viewport.removeEventListener("pointerenter", onEnter);
      viewport.removeEventListener("pointermove", onMove);
      viewport.removeEventListener("pointerleave", onLeave);
      viewport.removeEventListener("pointerdown", onDown);
      viewport.removeEventListener("pointerup", endDrag);
      viewport.removeEventListener("pointercancel", endDrag);
    };
  }, [reduced]);

  return (
    <section
      aria-label="Seedance 2.5 sample renders"
      className="relative border-t border-line"
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-2 md:px-10">
        <p className="hud-label text-faint">Rendered with Seedance 2.5</p>
        <p aria-hidden className="hud-label hidden text-faint sm:block">
          drag to scrub · loops
        </p>
      </div>

      {reduced ? (
        // Reduced motion: the same takes as a plain scrollable row.
        <div className="flex items-center gap-4 overflow-x-auto px-6 py-6 md:px-10">
          {SEEDANCE_SHOWCASE.map((clip, i) => (
            <figure
              key={clip.src}
              className="shrink-0 border border-line bg-bg-raised"
              style={{ width: GEOM[i].w, height: GEOM[i].h + CAPTION_H }}
            >
              <CardInner clip={clip} index={i} />
            </figure>
          ))}
        </div>
      ) : (
        <div
          ref={viewportRef}
          className="relative w-full cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing"
          style={{ height: BAND_H, perspective: "1400px" }}
        >
          {SEEDANCE_SHOWCASE.map((clip, i) => (
            <figure
              key={clip.src}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="absolute left-0 border border-line bg-bg-raised transition-[border-color] duration-150 will-change-transform hover:border-line-strong"
              style={{
                top: GEOM[i].top,
                width: GEOM[i].w,
                height: GEOM[i].h + CAPTION_H,
                transform: `translate3d(${GEOM[i].base}px, 0, 0)`,
              }}
            >
              <CardInner clip={clip} index={i} />
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}

function CardInner({ clip, index }: { clip: SeedanceClip; index: number }) {
  return (
    <>
      <video
        src={clip.src}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        aria-hidden
        className="pointer-events-none block w-full object-cover"
        style={{ height: HEIGHTS[index % HEIGHTS.length] }}
      />
      <figcaption
        className="hud-label flex items-center justify-between border-t border-line px-2.5 text-faint"
        style={{ height: CAPTION_H }}
      >
        <span>SD 2.5</span>
        <span>{String(index + 1).padStart(3, "0")}</span>
      </figcaption>
    </>
  );
}
