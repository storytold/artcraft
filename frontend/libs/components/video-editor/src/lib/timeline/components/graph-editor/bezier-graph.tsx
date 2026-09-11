"use client";

import { useRef, useState, type PointerEvent } from "react";
import { useShiftKey } from "../../../hooks/use-shift-key";
import { useCommittedRef } from "../../../hooks/use-committed-ref";
import { getBezierPoint } from "../../../animation/bezier";
import type { NormalizedCubicBezier } from "../../../animation/types";
import { cn } from "../../../utils/ui";

const GRAPH_WIDTH = 140;
const GRAPH_HEIGHT = 94;
const GRAPH_PADDING = 12;
const SVG_WIDTH = GRAPH_WIDTH + GRAPH_PADDING * 2;
const SVG_HEIGHT = GRAPH_HEIGHT + GRAPH_PADDING * 2;
const HANDLE_RADIUS = 3.5;
const ENDPOINT_RADIUS = 2;
const SNAP_THRESHOLD = 0.06;
const SNAP_TARGETS = [0, 1];
const CURVE_SEGMENTS = 64;
const Y_CLAMP_MIN = -0.5;
const Y_CLAMP_MAX = 1.5;

type BezierHandle = "c1" | "c2";

export const BEZIER_GRAPH_MIN_HEIGHT = SVG_HEIGHT;

function snap({
  value,
  targets,
  isEnabled,
}: {
  value: number;
  targets: number[];
  isEnabled: boolean;
}) {
  if (!isEnabled) return value;
  for (const target of targets) {
    if (Math.abs(value - target) < SNAP_THRESHOLD) return target;
  }
  return value;
}

function toSvgX({ value }: { value: number }) {
  return GRAPH_PADDING + value * GRAPH_WIDTH;
}

function toSvgY({ value }: { value: number }) {
  return GRAPH_PADDING + (1 - value) * GRAPH_HEIGHT;
}

function fromSvgX({ svgX }: { svgX: number }) {
  return Math.max(0, Math.min(1, (svgX - GRAPH_PADDING) / GRAPH_WIDTH));
}

function fromSvgY({ svgY }: { svgY: number }) {
  return Math.max(
    Y_CLAMP_MIN,
    Math.min(Y_CLAMP_MAX, 1 - (svgY - GRAPH_PADDING) / GRAPH_HEIGHT),
  );
}

function curvePath({ curve }: { curve: NormalizedCubicBezier }) {
  const points: string[] = [];
  for (let i = 0; i <= CURVE_SEGMENTS; i++) {
    const progress = i / CURVE_SEGMENTS;
    const x = toSvgX({ value: getBezierPoint({ progress, p0: 0, p1: curve[0], p2: curve[2], p3: 1 }) });
    const y = toSvgY({ value: getBezierPoint({ progress, p0: 0, p1: curve[1], p2: curve[3], p3: 1 }) });
    points.push(`${x},${y}`);
  }
  return `M${points.join("L")}`;
}

function clampHandleY({ svgY }: { svgY: number }) {
  return Math.max(HANDLE_RADIUS, Math.min(SVG_HEIGHT - HANDLE_RADIUS, svgY));
}

export function BezierGraph({
  value,
  onChange,
  onChangeEnd,
  onCancel,
}: {
  value: NormalizedCubicBezier;
  onChange?: (value: NormalizedCubicBezier) => void;
  onChangeEnd?: (value: NormalizedCubicBezier) => void;
  onCancel?: () => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeHandle, setActiveHandle] = useState<BezierHandle | null>(null);
  const isShiftPressedRef = useShiftKey();
  const latestValueRef = useCommittedRef(value);

  function getPointerPosition({
    event,
  }: {
    event: PointerEvent;
  }): { x: number; y: number } {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scale = SVG_WIDTH / rect.width;
    return {
      x: (event.clientX - rect.left) * scale,
      y: (event.clientY - rect.top) * (SVG_HEIGHT / rect.height),
    };
  }

  function onHandlePointerDown({ handle }: { handle: BezierHandle }) {
    return (event: PointerEvent<SVGCircleElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setActiveHandle(handle);
      event.currentTarget.setPointerCapture(event.pointerId);
    };
  }

  function onPointerMove({ event }: { event: PointerEvent<SVGSVGElement> }) {
    if (!activeHandle) return;
    const pointerPos = getPointerPosition({ event });
    const x = fromSvgX({ svgX: pointerPos.x });
    const y = snap({
      value: fromSvgY({ svgY: pointerPos.y }),
      targets: SNAP_TARGETS,
      isEnabled: !isShiftPressedRef.current,
    });
    const next: NormalizedCubicBezier = [...value];
    if (activeHandle === "c1") {
      next[0] = x;
      next[1] = y;
    } else {
      next[2] = x;
      next[3] = y;
    }
    latestValueRef.current = next;
    onChange?.(next);
  }

  function onPointerUp() {
    if (!activeHandle) return;
    setActiveHandle(null);
    onChangeEnd?.(latestValueRef.current);
  }

  function onPointerCancel() {
    if (!activeHandle) return;
    setActiveHandle(null);
    onCancel?.();
  }

  const path = curvePath({ curve: value });
  const c1 = { x: toSvgX({ value: value[0] }), y: toSvgY({ value: value[1] }) };
  const c2 = { x: toSvgX({ value: value[2] }), y: toSvgY({ value: value[3] }) };
  const c1Clamped = { x: c1.x, y: clampHandleY({ svgY: c1.y }) };
  const c2Clamped = { x: c2.x, y: clampHandleY({ svgY: c2.y }) };
  const p0 = { x: toSvgX({ value: 0 }), y: toSvgY({ value: 0 }) };
  const p1 = { x: toSvgX({ value: 1 }), y: toSvgY({ value: 1 }) };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className="bg-foreground/3 w-full cursor-crosshair select-none"
      onPointerMove={(event) => onPointerMove({ event })}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <title>Bezier curve editor</title>
      <line
        x1={p0.x}
        y1={p0.y}
        x2={p1.x}
        y2={p1.y}
        className="stroke-foreground/8"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <line
        x1={p0.x}
        y1={p0.y}
        x2={c1Clamped.x}
        y2={c1Clamped.y}
        className="stroke-primary/30"
        strokeWidth={1}
      />
      <line
        x1={p1.x}
        y1={p1.y}
        x2={c2Clamped.x}
        y2={c2Clamped.y}
        className="stroke-primary/30"
        strokeWidth={1}
      />
      <path
        d={path}
        fill="none"
        className="stroke-primary"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle
        cx={p0.x}
        cy={p0.y}
        r={ENDPOINT_RADIUS}
        className="fill-foreground/20"
      />
      <circle
        cx={p1.x}
        cy={p1.y}
        r={ENDPOINT_RADIUS}
        className="fill-foreground/20"
      />
      <circle
        cx={c1Clamped.x}
        cy={c1Clamped.y}
        r={HANDLE_RADIUS}
        className={cn(
          "fill-primary cursor-grab",
          activeHandle === "c1" && "cursor-grabbing",
        )}
        onPointerDown={onHandlePointerDown({ handle: "c1" })}
      />
      <circle
        cx={c2Clamped.x}
        cy={c2Clamped.y}
        r={HANDLE_RADIUS}
        className={cn(
          "fill-primary cursor-grab",
          activeHandle === "c2" && "cursor-grabbing",
        )}
        onPointerDown={onHandlePointerDown({ handle: "c2" })}
      />
    </svg>
  );
}
