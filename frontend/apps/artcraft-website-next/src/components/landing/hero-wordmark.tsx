"use client";

import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { watchThemeColors, type ThemeColors } from "@/lib/theme-colors";
import HeroWall, { createWallDrag } from "./hero-wall";

type PointerState = {
  x: number;
  y: number;
  active: boolean;
};

// The hero: the wordmark set in the site's display type, floating over a
// perspective render wall — two film-strip rows of Seedance takes forming
// one yawed wall behind the word, drifting sideways at parallax speeds.
// The type is real DOM text (crisp at any size, selectable by crawlers);
// the wall is the WebGL layer behind it. Dragging anywhere throws the wall
// with momentum; the pointer tilts it a few degrees. Server HTML,
// reduced-motion visitors, and WebGL failures all get the plain wordmark
// on the page background.
export default function HeroWordmark() {
  const [ready, setReady] = useState(false);
  const [colors, setColors] = useState<ThemeColors | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<PointerState>({ x: 0, y: 0, active: false });
  const wallDragRef = useRef(createWallDrag());

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

  // Pointer in scene coordinates (origin at container center, y up), plus
  // drag bookkeeping for the wall: pressing anywhere grabs the wall and
  // throws it, while pointer movement tilts the whole perspective.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const dragLast = { x: 0, t: 0 };
    const onMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointerRef.current.x = e.clientX - rect.left - rect.width / 2;
      pointerRef.current.y = -(e.clientY - rect.top - rect.height / 2);
      pointerRef.current.active = true;
      const d = wallDragRef.current;
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
      const d = wallDragRef.current;
      d.dragging = true;
      d.dx = 0;
      d.vel = 0;
      dragLast.x = e.clientX;
      dragLast.t = performance.now();
      container.setPointerCapture(e.pointerId);
    };
    const onUp = () => {
      wallDragRef.current.dragging = false;
    };
    const onLeave = () => {
      pointerRef.current.active = false;
      wallDragRef.current.dragging = false;
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

  const active = ready && colors !== null;

  return (
    <div
      ref={containerRef}
      className="relative h-[64svh] min-h-110 w-full touch-pan-y select-none"
    >
      {active && (
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
            <HeroWall pointer={pointerRef} drag={wallDragRef} colors={colors} />
          </Canvas>
        </CanvasBoundary>
      )}

      {/* The wordmark, justified flush to the hero width (the big-type
          poster treatment): SVG text with textLength stretches the word
          edge-to-edge at any viewport, so the height rides the width via
          the viewBox aspect. Still real selectable/crawlable text. The
          soft drop-shadow is a legibility halo lifting the type off the
          busy footage, not decoration (vw units so it scales with the
          word). */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4 text-ink-strong md:px-6">
        <svg
          className="w-[62%]"
          viewBox="0 0 720 74"
          style={{
            overflow: "visible",
            filter:
              "drop-shadow(0 0 0.3vw color-mix(in srgb, var(--bg) 60%, transparent)) drop-shadow(0 0.2vw 1.2vw color-mix(in srgb, var(--bg) 45%, transparent))",
          }}
        >
          <text
            x="360"
            y="72"
            textAnchor="middle"
            textLength="780"
            lengthAdjust="spacingAndGlyphs"
            fill="currentColor"
            style={{
              fontFamily:
                "var(--font-archivo-black), var(--font-archivo), system-ui, sans-serif",
              fontSize: "100px",
            }}
          >
            ARTCRAFT
          </text>
        </svg>
      </div>

      {active && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-1.5 z-10 flex items-center justify-between px-6 md:px-10"
        >
          <p className="hud-label text-faint">Rendered with Seedance 2.5</p>
          <p className="hud-label hidden text-faint sm:block">drag to scroll</p>
        </div>
      )}
    </div>
  );
}

// Perspective camera fitted so 1 world unit == 1 CSS pixel on the z=0 plane:
// wall layout and pointer coordinates all agree. FOV must match hero-wall's
// vignette projection.
function FittedCamera() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  useEffect(() => {
    const fov = 30;
    const dist = size.height / 2 / Math.tan(THREE.MathUtils.degToRad(fov / 2));
    camera.fov = fov;
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
