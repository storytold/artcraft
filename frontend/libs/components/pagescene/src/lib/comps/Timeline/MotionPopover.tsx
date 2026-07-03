import { useContext, useRef, useState } from "react";
import { EngineContext } from "../../contexts/EngineContext/EngineContext";
import { setKeyframeEasing } from "../../actions";
import {
  EASING_PRESETS,
  type EasingPresetName,
  type EasingSpec,
  type Keyframe,
} from "../../engine/timeline/types";

// The Motion popover edits a keyframe's easing curve (the interpolation
// INTO the next keyframe). Presets across the top, an editable cubic-bezier
// curve below with two draggable handles and a dotted linear reference.

const BOX = 150; // svg drawing box (px), domain [0,1]×[0,1]
const PAD = 14; // padding so handles/labels aren't clipped
const SPAN = BOX - PAD * 2;

// Map normalized (x,y) in [0,1] → svg coords (y is inverted so 1 is at top).
const sx = (x: number) => PAD + x * SPAN;
const sy = (y: number) => PAD + (1 - y) * SPAN;

const PRESETS: { name: EasingPresetName; label: string }[] = [
  { name: "linear", label: "Linear" },
  { name: "easeIn", label: "In" },
  { name: "easeOut", label: "Out" },
  { name: "easeInOut", label: "In-Out" },
];

interface MotionPopoverProps {
  keyframe: Keyframe;
  // Horizontal anchor as a percentage across the editor (playhead/keyframe pos).
  leftPercent: number;
}

export const MotionPopover = ({ keyframe, leftPercent }: MotionPopoverProps) => {
  const editor = useContext(EngineContext);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<null | "p1" | "p2">(null);

  const easing = keyframe.easing;

  const commit = (next: EasingSpec) => {
    if (editor) setKeyframeEasing(editor, keyframe.id, next);
  };

  const pointerToNorm = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    // rect may be scaled vs the BOX viewBox; normalize via SPAN in view units.
    const vx = ((e.clientX - rect.left) / rect.width) * BOX;
    const vy = ((e.clientY - rect.top) / rect.height) * BOX;
    const x = Math.max(0, Math.min(1, (vx - PAD) / SPAN));
    const y = Math.max(0, Math.min(1, 1 - (vy - PAD) / SPAN));
    return { x, y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const n = pointerToNorm(e);
    if (!n) return;
    if (dragging === "p1") commit({ ...easing, p1x: n.x, p1y: n.y });
    else commit({ ...easing, p2x: n.x, p2y: n.y });
  };

  const curvePath = `M ${sx(0)} ${sy(0)} C ${sx(easing.p1x)} ${sy(easing.p1y)} ${sx(
    easing.p2x,
  )} ${sy(easing.p2y)} ${sx(1)} ${sy(1)}`;

  return (
    <div
      className="glass glass-no-hover absolute bottom-full z-50 mb-2 w-[180px] -translate-x-1/2 rounded-2xl p-3 shadow-xl"
      style={{ left: `${Math.max(12, Math.min(88, leftPercent))}%` }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 text-xs font-semibold text-base-fg/80">Motion</div>
      <div className="mb-3 grid grid-cols-4 gap-1">
        {PRESETS.map((p) => {
          const preset = EASING_PRESETS[p.name];
          const active =
            preset.p1x === easing.p1x &&
            preset.p1y === easing.p1y &&
            preset.p2x === easing.p2x &&
            preset.p2y === easing.p2y;
          return (
            <button
              key={p.name}
              type="button"
              title={p.label}
              onClick={() => commit({ ...preset })}
              className={`flex h-8 items-center justify-center rounded-md border transition-colors ${
                active
                  ? "border-brand-primary bg-brand-primary/20"
                  : "border-ui-controls-border/60 hover:bg-ui-controls/40"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d={`M 2 18 C ${2 + preset.p1x * 16} ${18 - preset.p1y * 16} ${
                    2 + preset.p2x * 16
                  } ${18 - preset.p2y * 16} 18 2`}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-base-fg/80"
                />
              </svg>
            </button>
          );
        })}
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${BOX} ${BOX}`}
        className="w-full touch-none rounded-lg bg-black/20"
        onPointerMove={onPointerMove}
        onPointerUp={() => setDragging(null)}
        onPointerLeave={() => setDragging(null)}
      >
        {/* dotted linear reference */}
        <line
          x1={sx(0)}
          y1={sy(0)}
          x2={sx(1)}
          y2={sy(1)}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 3"
          className="text-base-fg/25"
        />
        {/* handle stems */}
        <line
          x1={sx(0)}
          y1={sy(0)}
          x2={sx(easing.p1x)}
          y2={sy(easing.p1y)}
          stroke="currentColor"
          strokeWidth="1"
          className="text-brand-primary/50"
        />
        <line
          x1={sx(1)}
          y1={sy(1)}
          x2={sx(easing.p2x)}
          y2={sy(easing.p2y)}
          stroke="currentColor"
          strokeWidth="1"
          className="text-brand-primary/50"
        />
        {/* the curve */}
        <path
          d={curvePath}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-base-fg"
        />
        {/* endpoints */}
        <circle cx={sx(0)} cy={sy(0)} r="2.5" className="fill-base-fg/50" />
        <circle cx={sx(1)} cy={sy(1)} r="2.5" className="fill-base-fg/50" />
        {/* draggable handles */}
        <circle
          cx={sx(easing.p1x)}
          cy={sy(easing.p1y)}
          r="5"
          className="cursor-grab fill-brand-primary"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragging("p1");
          }}
        />
        <circle
          cx={sx(easing.p2x)}
          cy={sy(easing.p2y)}
          r="5"
          className="cursor-grab fill-brand-primary"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragging("p2");
          }}
        />
      </svg>
    </div>
  );
};

export default MotionPopover;
