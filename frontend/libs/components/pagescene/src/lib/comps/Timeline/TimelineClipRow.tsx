import { useContext, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilm, faRepeat, faTrash } from "@fortawesome/pro-solid-svg-icons";
import { EngineContext } from "../../contexts/EngineContext/EngineContext";
import {
  moveClipLane,
  removeClipLane,
  resizeClipLane,
  setClipLoop,
} from "../../actions";
import {
  usePageSceneStore,
  type ClipLane,
} from "../../PageSceneStore";
import { DEFAULT_TIMELINE_FPS } from "../../engine/timeline/types";
import { fractionToTime, quantizeToFrame, timeToFraction } from "./timelineUtils";

interface TimelineClipRowProps {
  lane: ClipLane;
  duration: number;
}

// Drag intent for the current pointer gesture on a strip.
type Drag =
  | { kind: "move"; grabOffset: number } // seconds between pointer and strip start
  | { kind: "resize" };

// One stacked skeletal-animation clip strip under a character. The strip body
// drags to reposition (move), the right edge drags to trim its on-timeline
// length, the loop chip toggles repeat, and the trash button removes the lane.
export const TimelineClipRow = ({ lane, duration }: TimelineClipRowProps) => {
  const editor = useContext(EngineContext);
  const laneRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  const fps =
    editor?.timelineController.getTimeline()?.fps ?? DEFAULT_TIMELINE_FPS;

  const strip = lane.strip;
  const leftPct = timeToFraction(strip.startTime, duration) * 100;
  const widthPct = Math.max(
    (strip.duration / Math.max(duration, 1e-6)) * 100,
    1.5, // keep a hair of width visible while a fresh clip is still loading
  );

  const laneTimeFromEvent = (clientX: number): number => {
    const el = laneRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return quantizeToFrame(
      fractionToTime((clientX - rect.left) / rect.width, duration),
      fps,
    );
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !editor) return;
    const t = laneTimeFromEvent(e.clientX);
    if (drag.current.kind === "move") {
      moveClipLane(editor, lane.id, t - drag.current.grabOffset);
    } else {
      resizeClipLane(editor, lane.id, t - strip.startTime);
    }
  };

  const endDrag = () => {
    drag.current = null;
  };

  return (
    <div className="flex items-center gap-3 py-0.5">
      <div className="flex w-32 shrink-0 items-center gap-2 truncate ps-6 text-xs text-base-fg/70">
        <FontAwesomeIcon icon={faFilm} className="h-3 w-3 opacity-60" />
        <span className="truncate">{strip.name}</span>
      </div>

      <div
        ref={laneRef}
        className="relative h-6 flex-1 rounded-md bg-black/20"
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className="absolute inset-y-0 flex items-center gap-1 rounded-md border border-brand-primary/60 bg-brand-primary/25 px-1.5 text-[10px] text-white"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = {
              kind: "move",
              grabOffset: laneTimeFromEvent(e.clientX) - strip.startTime,
            };
          }}
        >
          <button
            type="button"
            title={strip.loop ? "Looping — click to play once" : "Play once — click to loop"}
            className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] ${
              strip.loop
                ? "bg-white/90 text-brand-primary"
                : "text-white/70 hover:text-white"
            }`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() =>
              editor && setClipLoop(editor, lane.id, !strip.loop)
            }
          >
            <FontAwesomeIcon icon={faRepeat} className="h-2.5 w-2.5" />
          </button>
          <span className="truncate">{strip.name}</span>

          {/* right-edge trim handle */}
          <div
            className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize rounded-r-md bg-white/40 hover:bg-white/70"
            title="Trim clip length"
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              drag.current = { kind: "resize" };
            }}
          />
        </div>
      </div>

      <button
        type="button"
        title="Remove animation"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base-fg/50 hover:bg-white/10 hover:text-base-fg"
        onClick={() => editor && removeClipLane(editor, lane.id)}
      >
        <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
      </button>
    </div>
  );
};

export default TimelineClipRow;
