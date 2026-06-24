import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

// Shared "floating thumbnail" that follows the cursor while dragging an item out
// of a library. Tuned to feel like physically carrying something rather than
// teleporting a flat image: it lifts in with a scale/opacity pop on pickup,
// trails the cursor with a touch of weight, and tilts into the direction of
// motion based on drag velocity. All motion is folded into a single transform
// driven by one rAF loop.
//
// Decoupled from any specific drag system via a `getState` callback the rAF polls
// each frame, so both the gallery (galleryDnd) and the 3D asset library (its own
// store-driven DnD) can reuse the exact same ghost.

const APPEAR_MS = 170; // pickup lift duration
const FOLLOW = 0.4; // cursor-follow easing (1 = rigid, lower = more trail/weight)
const TILT_PER_PX = 0.5; // velocity → tilt (deg per px/frame)
const MAX_TILT = 14; // clamp so it never looks broken

export interface DragGhostState {
  /** Page-space cursor position (document coords). */
  x: number;
  y: number;
  thumbnail: string;
  /** Optional caption rendered under the thumbnail (asset library shows names). */
  label?: string;
}

interface DragGhostProps {
  /** Polled every frame; return null when nothing is being dragged. */
  getState: () => DragGhostState | null;
  width?: number;
  height?: number;
  /** Pass "anonymous" for CORS-tainted asset thumbnails; omit for the gallery. */
  crossOrigin?: "anonymous" | "use-credentials";
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function DragGhost({
  getState,
  width = 120,
  height = 120,
  crossOrigin,
}: DragGhostProps) {
  const [, force] = useState(0);

  // Keep the latest getState in a ref so the rAF loop (started once) always reads
  // fresh drag state without restarting on every render.
  const getStateRef = useRef(getState);
  getStateRef.current = getState;

  // Animation state kept in refs so the rAF loop mutates without re-rendering.
  const appearStartRef = useRef<number | null>(null);
  const renderXRef = useRef(0);
  const renderYRef = useRef(0);
  const prevXRef = useRef(0);
  const tiltRef = useRef(0);

  useEffect(() => {
    let frame: number;
    function update() {
      const state = getStateRef.current();

      if (state) {
        // On the first frame of a drag, snap the rendered position to the cursor
        // and start the lift-in timer so it grows from the pickup point.
        if (appearStartRef.current === null) {
          appearStartRef.current = performance.now();
          renderXRef.current = state.x;
          renderYRef.current = state.y;
          prevXRef.current = state.x;
        }
        renderXRef.current += (state.x - renderXRef.current) * FOLLOW;
        renderYRef.current += (state.y - renderYRef.current) * FOLLOW;

        const velocityX = state.x - prevXRef.current;
        prevXRef.current = state.x;
        const targetTilt = clamp(velocityX * TILT_PER_PX, -MAX_TILT, MAX_TILT);
        // Ease the tilt toward target so it leans and recovers smoothly.
        tiltRef.current += (targetTilt - tiltRef.current) * 0.2;
      } else {
        appearStartRef.current = null;
        tiltRef.current = 0;
      }

      force((n) => (n + 1) & 0xffff);
      frame = requestAnimationFrame(update);
    }
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, []);

  const state = getState();
  if (
    !state ||
    appearStartRef.current === null ||
    typeof document === "undefined"
  ) {
    return null;
  }

  const appear = easeOutCubic(
    clamp((performance.now() - appearStartRef.current) / APPEAR_MS, 0, 1),
  );
  const scale = 0.62 + 0.38 * appear;

  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        left: renderXRef.current + 1,
        top: renderYRef.current - height / 2,
        width,
        height,
        opacity: appear,
        transform: `rotate(${tiltRef.current}deg) scale(${scale})`,
        transformOrigin: "center center",
        willChange: "transform, opacity",
        zIndex: 10000,
        pointerEvents: "none",
      }}
      className="flex cursor-grabbing flex-col overflow-hidden rounded-xl shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/20"
    >
      <img
        src={state.thumbnail}
        alt={state.label ?? ""}
        crossOrigin={crossOrigin}
        className="pointer-events-none min-h-0 w-full flex-1 select-none object-cover"
      />
      {state.label && (
        <div className="w-full select-none truncate bg-ui-controls px-2 py-1 text-center text-[12px]">
          {state.label}
        </div>
      )}
    </div>,
    document.body,
  );
}
