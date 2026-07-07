import { useContext, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faBackwardStep,
  faForwardStep,
  faChevronUp,
  faTrash,
} from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import { EngineContext } from "../../contexts/EngineContext/EngineContext";
import {
  cancelTimeline,
  deleteKeyframe,
  pauseTimeline,
  playTimeline,
  saveTimeline,
  seekTimeline,
} from "../../actions";
import { usePageSceneStore } from "../../PageSceneStore";
import { formatTimecode, fractionToTime, timeToFraction } from "./timelineUtils";
import { TimelineTrackRow } from "./TimelineTrackRow";
import { MotionPopover } from "./MotionPopover";
import { DurationLabel } from "./DurationLabel";

// Lane geometry: label column (w-32=8rem) + gap-3(0.75rem) … gap-3 + add-btn(w-7=1.75rem).
const LANE_LEFT = "8.75rem";
const LANE_RIGHT = "2.5rem";

// Expanded multi-track keyframe editor. Replaces the prompt box while open.
export const TimelineEditor = () => {
  const editor = useContext(EngineContext);
  const rulerRef = useRef<HTMLDivElement>(null);

  const tracks = usePageSceneStore((s) => s.timelineTracks);
  const duration = usePageSceneStore((s) => s.timelineDuration);
  const playhead = usePageSceneStore((s) => s.timelinePlayhead);
  const isPlaying = usePageSceneStore((s) => s.timelineIsPlaying);
  const outlinerItems = usePageSceneStore((s) => s.outlinerItems);
  const selectedObject = usePageSceneStore((s) => s.selectedObject);
  const selectedKeyframeId = usePageSceneStore(
    (s) => s.timelineSelectedKeyframeId,
  );
  const setExpanded = usePageSceneStore((s) => s.setTimelineExpanded);

  // Rows: any object with keyframes, plus the currently-selected object so
  // you can always add its first keyframe.
  const trackByUuid = new Map(tracks.map((t) => [t.objectUuid, t]));
  const rows = outlinerItems.filter(
    (item) => trackByUuid.has(item.id) || item.id === selectedObject?.id,
  );

  const selectedKeyframe = tracks
    .flatMap((t) => t.keyframes)
    .find((k) => k.id === selectedKeyframeId);

  const playheadFraction = timeToFraction(playhead, duration);

  const togglePlay = () => {
    if (!editor) return;
    if (isPlaying) pauseTimeline(editor);
    else playTimeline(editor);
  };

  const seekFromRuler = (clientX: number) => {
    const ruler = rulerRef.current;
    if (!ruler || !editor) return;
    const rect = ruler.getBoundingClientRect();
    pauseTimeline(editor);
    seekTimeline(editor, fractionToTime((clientX - rect.left) / rect.width, duration));
  };

  return (
    <div
      className="glass glass-no-hover absolute bottom-4 left-1/2 w-[90vw] max-w-5xl -translate-x-1/2 rounded-2xl p-3 text-white shadow-xl"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* transport + collapse */}
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          title="Go to start"
          onClick={() => editor && seekTimeline(editor, 0)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-base-fg/70 hover:bg-white/10"
        >
          <FontAwesomeIcon icon={faBackwardStep} className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          className="flex h-7 w-7 items-center justify-center rounded-full text-base-fg/90 hover:bg-white/10"
        >
          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Go to end"
          onClick={() => editor && seekTimeline(editor, duration)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-base-fg/70 hover:bg-white/10"
        >
          <FontAwesomeIcon icon={faForwardStep} className="h-3.5 w-3.5" />
        </button>
        <span className="ml-2 tabular-nums text-xs text-base-fg/60">
          {formatTimecode(playhead)} / {formatTimecode(duration)}
        </span>
        <button
          type="button"
          title="Collapse timeline"
          onClick={() => setExpanded(false)}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-base-fg/60 hover:bg-white/10"
        >
          <FontAwesomeIcon icon={faChevronUp} className="h-3 w-3" />
        </button>
      </div>

      {/* ruler + tracks (playhead line spans this region) */}
      <div className="relative">
        <div className="mb-1 flex items-center gap-3">
          <div className="w-32 shrink-0" />
          <div
            ref={rulerRef}
            className="relative h-5 flex-1 cursor-pointer text-[10px] text-base-fg/50"
            onClick={(e) => seekFromRuler(e.clientX)}
          >
            <span className="absolute left-0">{formatTimecode(0)}</span>
            <span className="absolute left-1/2 -translate-x-1/2">
              {formatTimecode(duration / 2)}
            </span>
            <DurationLabel className="absolute right-0" />
          </div>
          <div className="w-7 shrink-0" />
        </div>

        {rows.length === 0 ? (
          <div className="py-6 text-center text-xs text-base-fg/40">
            Select an object, then add a keyframe to start animating.
          </div>
        ) : (
          rows.map((item) => (
            <TimelineTrackRow
              key={item.id}
              item={item}
              track={trackByUuid.get(item.id)}
              duration={duration}
            />
          ))
        )}

        {/* playhead line over the lane area */}
        <div
          className="pointer-events-none absolute inset-y-0"
          style={{ left: LANE_LEFT, right: LANE_RIGHT }}
        >
          <div
            className="absolute inset-y-0 w-px bg-white"
            style={{ left: `${playheadFraction * 100}%` }}
          />
        </div>

        {selectedKeyframe && (
          <MotionPopover
            keyframe={selectedKeyframe}
            leftPercent={timeToFraction(selectedKeyframe.time, duration) * 100}
          />
        )}
      </div>

      {/* footer */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[11px] text-base-fg/40">
          Each diamond stores an object's full position, rotation and scale at
          that moment. Tap a diamond to jump to it.
        </span>
        <div className="flex items-center gap-2">
          {selectedKeyframe && (
            <Button
              variant="secondary"
              icon={faTrash}
              className="flex h-9 items-center border border-ui-controls-border bg-ui-controls/60 px-3 text-sm text-base-fg hover:bg-ui-controls/90"
              onClick={() => editor && deleteKeyframe(editor, selectedKeyframe.id)}
            >
              Delete
            </Button>
          )}
          <Button
            variant="secondary"
            className="flex h-9 items-center border border-ui-controls-border bg-ui-controls/60 px-3 text-sm text-base-fg hover:bg-ui-controls/90"
            onClick={() => editor && cancelTimeline(editor)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex h-9 items-center border-none bg-brand-primary px-3 text-sm text-white"
            onClick={() => editor && saveTimeline(editor)}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TimelineEditor;
