import { useContext, useRef } from "react";
import { DynamicIcon } from "@storyteller/icons";
import { EngineContext } from "../../contexts/EngineContext/EngineContext";
import { addKeyframe, moveKeyframe, seekTimeline } from "../../actions";
import {
  usePageSceneStore,
  type OutlinerItem,
  type TimelineTrack,
} from "../../PageSceneStore";
import { DEFAULT_TIMELINE_FPS } from "../../engine/timeline/types";
import {
  fractionToTime,
  quantizeToFrame,
  timeToFraction,
} from "./timelineUtils";

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
  const easingKeyframeId = usePageSceneStore((s) => s.timelineEasingKeyframeId);
  const setEasingKeyframe = usePageSceneStore(
    (s) => s.setTimelineEasingKeyframe,
  );

  const keyframes = track?.keyframes ?? [];
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  const laneTimeFromEvent = (clientX: number): number => {
    const lane = laneRef.current;
    if (!lane) return 0;
    const rect = lane.getBoundingClientRect();
    // Keyframes live on the timeline's frame grid, same as scrubbing.
    const fps = editor?.timelineController.getTimeline()?.fps ?? DEFAULT_TIMELINE_FPS;
    return quantizeToFrame(
      fractionToTime((clientX - rect.left) / rect.width, duration),
      fps,
    );
  };

  const selectKeyframe = (id: string, time: number) => {
    setSelectedKeyframe(id);
    if (editor) seekTimeline(editor, time);
  };

  return (
    <div className="flex items-center gap-3 py-1">
      {/* Keep this column exactly w-32: the ruler row and playhead overlay
          assume it. Indent with padding, never margin (margin widens the
          column and shifts the lanes out of alignment). */}
      <div className="flex w-32 shrink-0 items-center gap-2 truncate ps-2 text-sm text-base-fg/90">
        <DynamicIcon icon={item.icon} className="h-3.5 w-3.5 opacity-70" />
        <span className="truncate">{item.name}</span>
      </div>

      <div
        ref={laneRef}
        className="relative h-9 flex-1 rounded-[3px] bg-white/5"
        onPointerMove={(e) => {
          if (!draggingId.current || !editor) return;
          moveKeyframe(
            editor,
            draggingId.current,
            laneTimeFromEvent(e.clientX),
          );
        }}
        onPointerUp={() => {
          draggingId.current = null;
        }}
        onPointerLeave={() => {
          draggingId.current = null;
        }}
      >
        {/* connecting line between the first and last keyframe */}
        {sorted.length >= 2 && (
          <div
            className="pointer-events-none absolute top-1/2 h-px -translate-y-1/2 bg-white/30"
            style={{
              left: `${timeToFraction(sorted[0].time, duration) * 100}%`,
              right: `${(1 - timeToFraction(sorted[sorted.length - 1].time, duration)) * 100}%`,
            }}
          />
        )}

        {/* easing chip between each pair of keyframes — toggles the Motion
            popover for this segment (the curve INTO the next keyframe,
            stored on the left keyframe) */}
        {sorted.slice(0, -1).map((kf, i) => {
          const next = sorted[i + 1];
          const mid =
            (timeToFraction(kf.time, duration) +
              timeToFraction(next.time, duration)) /
            2;
          const active = easingKeyframeId === kf.id;
          return (
            <button
              key={`ease-${kf.id}`}
              type="button"
              title="Edit easing"
              data-easing-chip
              className={`absolute top-1/2 flex h-5 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[3px] border bg-black/60 ${
                active
                  ? "border-brand-primary text-white"
                  : "border-white/40 text-white/80 hover:border-white/80 hover:text-white"
              }`}
              style={{ left: `${mid * 100}%` }}
              onClick={() => setEasingKeyframe(active ? null : kf.id)}
            >
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <path
                  d="M1 9 C 5 9, 7 1, 11 1"
                  stroke="currentColor"
                  strokeWidth="1.25"
                />
              </svg>
            </button>
          );
        })}

        {sorted.map((kf) => {
          const selected = kf.id === selectedKeyframeId;
          return (
            <div
              key={kf.id}
              role="button"
              tabIndex={0}
              data-keyframe
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
                // Selecting a keyframe never opens the Motion popover —
                // that's the easing chip's job.
                setEasingKeyframe(null);
                selectKeyframe(kf.id, kf.time);
              }}
            />
          );
        })}
      </div>

      <button
        type="button"
        title="Add keyframe at playhead"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] text-base-fg/70 hover:bg-white/10 hover:text-base-fg"
        onClick={() => {
          if (editor) addKeyframe(editor, item.id);
        }}
      >
        <span className="block h-2 w-2 rotate-45 rounded-[1px] border-[1.5px] border-current" />
      </button>
    </div>
  );
};

export default TimelineTrackRow;
