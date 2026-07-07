import { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause, faChevronDown } from "@fortawesome/pro-solid-svg-icons";
import { EngineContext } from "../../contexts/EngineContext/EngineContext";
import { pauseTimeline, playTimeline, seekTimeline } from "../../actions";
import { usePageSceneStore } from "../../PageSceneStore";
import { formatTimecode } from "./timelineUtils";
import { DurationLabel } from "./DurationLabel";

// Collapsed timeline bar: play/pause · time · scrubber · duration · expand.
// Sits above the prompt card (rendered via the promptbox aboveStackSlot).
// `readOnly` (record mode) hides the expand chevron — playback only.
export const TimelineBar = ({ readOnly = false }: { readOnly?: boolean }) => {
  const editor = useContext(EngineContext);
  const playhead = usePageSceneStore((s) => s.timelinePlayhead);
  const isPlaying = usePageSceneStore((s) => s.timelineIsPlaying);
  const duration = usePageSceneStore((s) => s.timelineDuration);
  const setExpanded = usePageSceneStore((s) => s.setTimelineExpanded);

  const togglePlay = () => {
    if (!editor) return;
    if (isPlaying) pauseTimeline(editor);
    else playTimeline(editor);
  };

  return (
    <div
      className="glass glass-no-hover flex w-full items-center gap-3 rounded-2xl px-4 py-2 text-white shadow-xl"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={togglePlay}
        className="flex h-7 w-7 items-center justify-center rounded-full text-base-fg/80 hover:bg-white/10"
      >
        <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="h-3.5 w-3.5" />
      </button>
      <span className="w-9 shrink-0 tabular-nums text-xs text-base-fg/70">
        {formatTimecode(playhead)}
      </span>
      <input
        type="range"
        min={0}
        max={duration}
        step={0.01}
        value={playhead}
        onChange={(e) => {
          if (!editor) return;
          pauseTimeline(editor);
          seekTimeline(editor, parseFloat(e.target.value));
        }}
        className="h-1 flex-1 cursor-pointer accent-white"
      />
      {readOnly ? (
        <span className="w-9 shrink-0 text-right tabular-nums text-xs text-base-fg/70">
          {formatTimecode(duration)}
        </span>
      ) : (
        <DurationLabel className="shrink-0 text-right text-xs text-base-fg/70" />
      )}
      {!readOnly && (
        <button
          type="button"
          title="Expand timeline"
          onClick={() => setExpanded(true)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-base-fg/60 hover:bg-white/10"
        >
          <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

export default TimelineBar;
