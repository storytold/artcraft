"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import LazyVideo from "@/components/lazy-video";
import { watchThemeColors, type ThemeColors } from "@/lib/theme-colors";

// Plain code-split dynamic import — NOT `ssr: false`. It never renders during
// SSR (gated by `ready`, false on the server), so WebGL stays off the server
// without a client-side-rendering bailout around the hero.
const HeroScene = dynamic(() => import("./hero-scene"));

const IDLE_CENTER = 50;
const IDLE_SWING = 16;
const POINTER_MIN = 10;
const POINTER_MAX = 90;

// The hero comparator. The real product reel (the AI render) is the base
// layer; a wireframe 3D blocking viewport is clipped on top. The vertical
// scan line follows the visitor's cursor — sweeping between "what you
// control" and "what you get" — and drifts on its own when idle.
//
// Reduced motion, coarse pointers, small screens, hidden tabs, and WebGL
// failures all degrade to the plain footage.
export default function HeroViewport({
  videoSrc,
  videoLabel,
}: {
  videoSrc: string;
  videoLabel: string;
}) {
  const [ready, setReady] = useState(false);
  const [colors, setColors] = useState<ThemeColors | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const insideRef = useRef(false);
  const targetPctRef = useRef(IDLE_CENTER);

  // Gate: capable device, motion allowed, tab actually foregrounded.
  useEffect(() => {
    const capable =
      window.matchMedia("(pointer: fine) and (min-width: 768px)").matches &&
      window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    if (!capable) return;

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

  // Theme tokens → scene colors, re-derived when the theme flips.
  useEffect(() => {
    if (!ready) return;
    return watchThemeColors(setColors);
  }, [ready]);

  // Scan-line driver: pointer position while hovered, slow sweep when idle.
  useEffect(() => {
    if (!ready || !colors) return;
    const container = containerRef.current;
    if (!container) return;

    const onMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      insideRef.current = true;
      pointerRef.current.x = nx * 2 - 1;
      pointerRef.current.y = ny * 2 - 1;
      targetPctRef.current =
        POINTER_MIN + nx * (POINTER_MAX - POINTER_MIN);
    };
    const onLeave = () => {
      insideRef.current = false;
      pointerRef.current.x = 0;
      pointerRef.current.y = 0;
    };
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);

    let raf = 0;
    let pct = IDLE_CENTER;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (!insideRef.current) {
        targetPctRef.current =
          IDLE_CENTER + Math.sin(now / 1000 / 3.4) * IDLE_SWING;
      }
      pct += (targetPctRef.current - pct) * (1 - Math.exp(-5 * dt));
      if (clipRef.current) {
        clipRef.current.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      }
      if (lineRef.current) {
        lineRef.current.style.left = `${pct}%`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [ready, colors]);

  const sceneActive = ready && colors !== null;

  return (
    <div ref={containerRef} className="absolute inset-0">
      <LazyVideo
        src={videoSrc}
        label={videoLabel}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {sceneActive && (
        <CanvasBoundary>
          {/* Blocking viewport, clipped to the left of the scan line. The
              wrapper is opaque so the wireframe world replaces the footage
              on its side rather than floating over it. */}
          <div
            ref={clipRef}
            aria-hidden
            className="absolute inset-0 bg-bg-sunken"
            style={{ clipPath: "inset(0 50% 0 0)" }}
          >
            <HeroScene colors={colors} pointer={pointerRef} />
            <p className="hud-label absolute bottom-3 left-3 bg-invert-bg px-3 py-1.5 font-bold text-invert-fg">
              3D blocking — your control
            </p>
          </div>

          {/* Scan line */}
          <div
            ref={lineRef}
            aria-hidden
            className="absolute top-0 bottom-0 w-px -translate-x-1/2 bg-accent"
            style={{ left: "50%", boxShadow: "0 0 12px 1px var(--accent)" }}
          />

          <p
            aria-hidden
            className="hud-label absolute right-3 bottom-3 bg-invert-bg px-3 py-1.5 font-bold text-invert-fg"
          >
            AI render — your shot
          </p>
        </CanvasBoundary>
      )}
    </div>
  );
}

// WebGL is allowed to fail; the footage underneath is the fallback.
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

