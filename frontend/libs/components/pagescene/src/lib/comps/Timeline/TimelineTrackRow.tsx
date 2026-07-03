import { useContext, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/pro-solid-svg-icons";
import { EngineContext } from "../../contexts/EngineContext/EngineContext";
import {
  addKeyframe,
  moveKeyframe,
  seekTimeline,
} from "../../actions";
import {
  usePageSceneStore,
  type OutlinerItem,
  type TimelineTrack,
} from "../../PageSceneStore";
import { fractionToTime, timeToFraction } from "./timelineUtils";

interface TimelineTrackRowProps {
  item: OutlinerItem;
  track: TimelineTrack | undefined;
  duration: number;
}

export const TimelineTrackRow = ({
  item,
  track,
  duration,
}: TimelineTrackRowProps) => {
  const editor = useContext(EngineContext);
  const laneRef = useRef<HTMLDivElement>(null);
  const draggingId = useRef<string | null>(null);

  const selectedKeyframeId = usePageSceneStore(
    (s) => s.timelineSelectedKeyframeId,
  );
  const setSelectedKeyframe = usePageSceneStore(
    (s) => s.setTimelineSelectedKeyframe,
  );

  const keyframes = track?.keyframes ?? [];

  const laneTimeFromEvent = (clientX: number): number => {
    const lane = laneRef.current;
    if (!lane) return 0;
    const rect = lane.getBoundingClientRect();
    return fractionToTime((clientX - rect.left) / rect.width, duration);
  };

  const selectKeyframe = (id: string, time: number) => {
    setSelectedKeyframe(id);
    if (editor) seekTimeline(editor, time);
  };

  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex w-32 shrink-0 items-center gap-2 truncate text-sm text-base-fg/90">
        <FontAwesomeIcon icon={item.icon} className="h-3.5 w-3.5 opacity-70" />
        <span className="truncate">{item.name}</span>
      </div>

      <div
        ref={laneRef}
        className="relative h-7 flex-1 rounded-md bg-white/5"
        onPointerMove={(e) => {
          if (!draggingId.current || !editor) return;
          moveKeyframe(editor, draggingId.current, laneTimeFromEvent(e.clientX));
        }}
        onPointerUp={() => {
          draggingId.current = null;
        }}
        onPointerLeave={() => {
          draggingId.current = null;
        }}
      >
        {keyframes.map((kf) => {
          const selected = kf.id === selectedKeyframeId;
          return (
            <div
              key={kf.id}
              role="button"
              tabIndex={0}
              title={`${kf.time.toFixed(2)}s`}
              className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 cursor-grab rounded-[2px] border transition-colors ${
                selected
                  ? "border-brand-primary bg-brand-primary"
                  : "border-white/70 bg-white"
              }`}
              style={{ left: `${timeToFraction(kf.time, duration) * 100}%` }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                draggingId.current = kf.id;
                selectKeyframe(kf.id, kf.time);
              }}
            />
          );
        })}
      </div>

      <button
        type="button"
        title="Add keyframe at playhead"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-ui-controls-border/60 text-base-fg/70 hover:bg-ui-controls/40"
        onClick={() => {
          if (editor) addKeyframe(editor, item.id);
        }}
      >
        <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
      </button>
    </div>
  );
};

export default TimelineTrackRow;
