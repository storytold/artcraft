import { useContext, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilm,
  faRepeat,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
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
  lanes: ClipLane[];
  duration: number;
}

// Drag intent for the current pointer gesture.
type Drag =
  | { laneId: string; kind: "move"; grabOffset: number } // seconds pointer→start
  | { laneId: string; kind: "resize" };

// A character's skeletal-animation clips on ONE shared row (single row per
// character; the overlap guard in TimelineController keeps them a
// non-overlapping sequence). Each strip drags to move, its right edge trims
// length, the loop chip toggles repeat, the × removes it. Dropping a clip from
// the Animations drawer is handled by the character block wrapper in
// TimelineEditor, so an empty row still accepts drops.
export const TimelineClipRow = ({ lanes, duration }: TimelineClipRowProps) => {
  const editor = useContext(EngineContext);
  const laneRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  const fps =
    editor?.timelineController.getTimeline()?.fps ?? DEFAULT_TIMELINE_FPS;

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
      moveClipLane(editor, drag.current.laneId, t - drag.current.grabOffset);
    } else {
      const lane = lanes.find((l) => l.id === drag.current?.laneId);
      if (lane) resizeClipLane(editor, lane.id, t - lane.strip.startTime);
    }
  };

  const endDrag = () => {
    drag.current = null;
  };

  return (
    <div className="flex items-center gap-3 py-0.5">
      <div className="flex w-32 shrink-0 items-center gap-2 truncate ps-6 text-xs text-base-fg/50">
        <FontAwesomeIcon icon={faFilm} className="h-3 w-3 opacity-60" />
        <span className="truncate">Animation</span>
      </div>

      <div
        ref={laneRef}
        className="relative h-6 flex-1 rounded-md bg-black/20"
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
      >
        {lanes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md border border-dashed border-white/15 text-[10px] text-base-fg/30">
            Drag an animation here
          </div>
        )}

        {lanes.map((lane) => {
          const strip = lane.strip;
          const leftPct = timeToFraction(strip.startTime, duration) * 100;
          const widthPct = Math.max(
            (strip.duration / Math.max(duration, 1e-6)) * 100,
            1.5, // stay visible while a fresh clip's real length is loading
          );
          return (
            <div
              key={lane.id}
              className="absolute inset-y-0 flex items-center gap-1 rounded-md border border-brand-primary/60 bg-brand-primary/25 pe-1 ps-1.5 text-[10px] text-white"
              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                drag.current = {
                  laneId: lane.id,
                  kind: "move",
                  grabOffset: laneTimeFromEvent(e.clientX) - strip.startTime,
                };
              }}
            >
              <button
                type="button"
                title={
                  strip.loop
                    ? "Looping — click to play once"
                    : "Play once — click to loop"
                }
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

              <span className="min-w-0 flex-1 truncate">{strip.name}</span>

              <button
                type="button"
                title="Remove animation"
                className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] text-white/70 hover:bg-white/20 hover:text-white"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => editor && removeClipLane(editor, lane.id)}
              >
                <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
              </button>

              {/* right-edge trim handle */}
              <div
                className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize rounded-r-md bg-white/40 hover:bg-white/70"
                title="Trim clip length"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  drag.current = { laneId: lane.id, kind: "resize" };
                }}
              />
            </div>
          );
        })}
      </div>

      {/* spacer to match the keyframe row's add-button column (keeps lane
          widths aligned with the ruler) */}
      <div className="w-7 shrink-0" />
    </div>
  );
};

export default TimelineClipRow;
