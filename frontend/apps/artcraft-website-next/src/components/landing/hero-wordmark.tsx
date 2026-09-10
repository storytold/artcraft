"use client";

import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { watchThemeColors, type ThemeColors } from "@/lib/theme-colors";
import { heroWordmark } from "@/components/ruler/ruler-shared";
import HeroWall, { createWallDrag } from "./hero-wall";

const WORDMARK_TEXT = "ARTCRAFT";
const WORDMARK_FONT =
  "var(--font-archivo-black), var(--font-archivo), system-ui, sans-serif";

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
  const [onScreen, setOnScreen] = useState(true);

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

  // The hero sits at the top of a long page. Once it scrolls away there is
  // nothing to look at, so stop the render loop and let the wall park its
  // video decoders. Same when the tab goes to the background, which the
  // observer alone would not catch.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let intersecting = true;
    const sync = () => setOnScreen(intersecting && !document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry.isIntersecting;
        sync();
      },
      // Generous margin: the wall refills its decoders a few at a time, so
      // it needs a head start to be at full speed by the time a scroll back
      // up actually brings it into view.
      { rootMargin: "600px 0px" },
    );
    observer.observe(container);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
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
            // Video panels gain nothing from a 2x framebuffer; the hairline
            // frames are the only detail that wants the extra samples, and
            // 1.5x plus MSAA keeps them clean for a lot less fill.
            dpr={[1, 1.5]}
            frameloop={onScreen ? "always" : "never"}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            <FittedCamera />
            <HeroWall
              pointer={pointerRef}
              drag={wallDragRef}
              colors={colors}
              onScreen={onScreen}
            />
          </Canvas>
        </CanvasBoundary>
      )}

      {/* The wordmark, justified flush to the hero width (the big-type
          poster treatment) — per-letter spans instead of SVG text, because
          these very spans ARE the ruler's hero heading: the scroll ruler's
          HeadingFlow drives their transforms so the resting title peels
          tail-first onto the rail as the visitor scrolls out of the
          landing. Crawlable via role="img" + aria-label; z-40 so letters
          in transit ride above later sections (below the z-50 nav). */}
      <MorphWordmark />

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

// The justified wordmark letters. Font size is derived so the word's
// natural advance run spans the 62% column exactly (the spacingAndGlyphs
// stretch of the old SVG, minus the SVG). After layout, each letter's
// natural center and advance are measured and published to the shared
// heroWordmark channel for the ruler to drive; transforms are reset before
// measuring so a mid-morph resize re-baselines cleanly.
function MorphWordmark() {
  const boxRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [fontPx, setFontPx] = useState(0);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    let cancelled = false;

    const compute = () => {
      if (cancelled) return;
      const probe = document.createElement("span");
      probe.style.cssText =
        "position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;font-size:100px;line-height:1;";
      probe.style.fontFamily = WORDMARK_FONT;
      probe.textContent = WORDMARK_TEXT;
      document.body.appendChild(probe);
      const w100 = probe.getBoundingClientRect().width;
      probe.remove();
      const target = box.clientWidth;
      if (w100 > 0 && target > 0) {
        setFontPx(Math.round((target / w100) * 1000) / 10);
      }
    };

    const ready = document.fonts?.ready;
    if (ready) ready.then(compute).catch(compute);
    else compute();
    const ro = new ResizeObserver(compute);
    ro.observe(box);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, []);

  // Publish letter geometry once the real size is applied.
  useEffect(() => {
    if (!fontPx) return;
    const els = letterRefs.current.filter(
      (el): el is HTMLSpanElement => !!el,
    );
    if (els.length !== WORDMARK_TEXT.length) return;

    const measure = () => {
      for (const el of els) el.style.transform = "";
      const rects = els.map((el) => el.getBoundingClientRect());
      heroWordmark.els = els;
      heroWordmark.baseX = rects.map((r) => r.left + r.width / 2);
      heroWordmark.baseDocY = rects.map(
        (r) => r.top + r.height / 2 + window.scrollY,
      );
      const adv = rects.map((r) => r.width / fontPx);
      const cum: number[] = [];
      let total = 0;
      for (const a of adv) {
        cum.push(total);
        total += a;
      }
      heroWordmark.metrics = { adv, cum, total };
      heroWordmark.fontPx = fontPx;
      heroWordmark.ready = true;
    };

    measure();
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      heroWordmark.ready = false;
      heroWordmark.els = [];
    };
  }, [fontPx]);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center px-4 md:px-6">
      <div ref={boxRef} className="w-[62%]">
        <div
          role="img"
          aria-label={WORDMARK_TEXT}
          className="whitespace-pre text-ink-strong"
          style={{
            fontFamily: WORDMARK_FONT,
            fontSize: fontPx || "10.5vw",
            lineHeight: 1,
          }}
        >
          {WORDMARK_TEXT.split("").map((ch, i) => (
            <span
              key={i}
              aria-hidden
              ref={(el) => {
                letterRefs.current[i] = el;
              }}
              className="inline-block"
              style={{
                willChange: "transform, opacity",
                // Three stacked halos in the page background color: a tight
                // contact edge, a mid falloff, and a wide pool that sinks
                // the busiest footage behind the letters. Sized in vw so the
                // spread tracks the type as the wordmark scales.
                textShadow: [
                  "0 0 0.6vw color-mix(in srgb, var(--bg) 92%, transparent)",
                  "0 0.25vw 2.4vw color-mix(in srgb, var(--bg) 78%, transparent)",
                  "0 0.4vw 5vw color-mix(in srgb, var(--bg) 55%, transparent)",
                ].join(", "),
              }}
            >
              {ch}
            </span>
          ))}
        </div>
      </div>
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
