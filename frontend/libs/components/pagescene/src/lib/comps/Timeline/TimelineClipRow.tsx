import { useContext, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilm,
  faPlus,
  faRepeat,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { EngineContext } from "../../contexts/EngineContext/EngineContext";
import {
  addBakedClipToObject,
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
import { ToastTypes } from "../../enums";
import { fractionToTime, quantizeToFrame, timeToFraction } from "./timelineUtils";

interface TimelineClipRowProps {
  objectUuid: string;
  lanes: ClipLane[];
  duration: number;
  // Display names of the clips baked into the object's own GLB; non-empty
  // renders the "+" baked-clip picker in the label column.
  bakedClips?: string[];
  // Whether animation drags can land on this row (skinned objects). Rows for
  // baked-only objects render without the drop hint.
  droppable?: boolean;
}

// Drag intent for the current pointer gesture.
type Drag =
  | { laneId: string; kind: "move"; grabOffset: number } // seconds pointer→start
  | { laneId: string; kind: "resize" };

// An object's animation clips on ONE shared row (the overlap guard in
// TimelineController keeps them a non-overlapping sequence). Each strip drags
// to move, its right edge trims length, the loop chip toggles repeat, the ×
// removes it (for baked clips that only unschedules — the clip itself stays
// on the model and in the picker). Library-clip drops are handled by the row
// wrapper in TimelineEditor, so an empty row still accepts drops; baked clips
// are added through the "+" picker.
export const TimelineClipRow = ({
  objectUuid,
  lanes,
  duration,
  bakedClips,
  droppable,
}: TimelineClipRowProps) => {
  const editor = useContext(EngineContext);
  const laneRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const selectedLaneId = usePageSceneStore(
    (s) => s.timelineSelectedClipLaneId,
  );

  const addBaked = (clipIndex: number) => {
    setPickerOpen(false);
    if (!editor) return;
    const laneId = addBakedClipToObject(editor, objectUuid, clipIndex);
    if (!laneId) {
      editor.adapter.showToast(
        ToastTypes.WARNING,
        "No room left on this row for that clip.",
      );
    }
  };

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
        {bakedClips && bakedClips.length > 0 && (
          <div className="relative shrink-0">
            <button
              type="button"
              title="Add one of this object's baked animations"
              className={`flex h-4 w-4 items-center justify-center rounded-[4px] transition-colors ${
                pickerOpen
                  ? "bg-brand-primary text-white"
                  : "bg-white/10 text-base-fg/70 hover:bg-white/20 hover:text-base-fg"
              }`}
              onClick={() => setPickerOpen((open) => !open)}
            >
              <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" />
            </button>
            {pickerOpen && (
              <>
                {/* click-away backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setPickerOpen(false)}
                />
                <div className="absolute bottom-full left-0 z-50 mb-1 max-h-40 w-44 overflow-y-auto rounded-lg border border-white/10 bg-ui-controls py-1 shadow-xl">
                  {bakedClips.map((clipName, clipIndex) => (
                    <button
                      key={clipIndex}
                      type="button"
                      className="block w-full truncate px-2.5 py-1 text-left text-[11px] text-base-fg/90 hover:bg-white/10"
                      onClick={() => addBaked(clipIndex)}
                    >
                      {clipName}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
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
            {droppable
              ? "Drag an animation here"
              : "Add a baked animation with +"}
          </div>
        )}

        {lanes.map((lane) => {
          const strip = lane.strip;
          const isSelected = selectedLaneId === lane.id;
          const leftPct = timeToFraction(strip.startTime, duration) * 100;
          const widthPct = Math.max(
            (strip.duration / Math.max(duration, 1e-6)) * 100,
            1.5, // stay visible while a fresh clip's real length is loading
          );
          return (
            /* data-clip-strip: exempt from the click-away deselect in
               TimelineEditor (pointerdown selects; the same gesture must
               not immediately deselect). */
            <div
              key={lane.id}
              data-clip-strip
              className={`absolute inset-y-0 flex items-center gap-1 rounded-md border pe-1 ps-1.5 text-[10px] text-white ${
                isSelected
                  ? "border-white/80 bg-brand-primary/45"
                  : "border-brand-primary/60 bg-brand-primary/25"
              }`}
              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
              onPointerDown={(e) => {
                usePageSceneStore
                  .getState()
                  .setTimelineSelectedClipLane(lane.id);
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

              {/* × only on the selected strip — an always-visible remove was
                  far too easy to hit by accident. Del/Backspace also removes
                  the selected strip, and removal is undoable. */}
              {isSelected && (
                <button
                  type="button"
                  title="Remove animation (Del)"
                  className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] text-white/70 hover:bg-white/20 hover:text-white"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    if (!editor) return;
                    removeClipLane(editor, lane.id);
                    usePageSceneStore
                      .getState()
                      .setTimelineSelectedClipLane(null);
                  }}
                >
                  <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
                </button>
              )}

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
