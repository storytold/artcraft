import { useContext, useEffect, useRef, useState } from "react";
import { EngineContext } from "../../contexts/EngineContext";
import { setTimelineDuration } from "../../actions";
import { usePageSceneStore } from "../../PageSceneStore";
import { formatTimecode } from "./timelineUtils";

// The total-duration readout, click-to-edit. Click → number input (seconds);
// Enter/blur commits, Escape cancels. Backed by TimelineController.setDuration
// (clamped to [1,60], covers the required 5–30s range).
export const DurationLabel = ({ className = "" }: { className?: string }) => {
  const editor = useContext(EngineContext);
  const duration = usePageSceneStore((s) => s.timelineDuration);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const secs = parseFloat(value);
    if (editor && Number.isFinite(secs)) setTimelineDuration(editor, secs);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={1}
        max={60}
        step={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className={`w-12 rounded-[3px] bg-white/10 px-1 text-center tabular-nums text-base-fg outline-none ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      title="Set timeline duration (seconds)"
      onClick={(e) => {
        e.stopPropagation();
        setValue(String(Math.round(duration)));
        setEditing(true);
      }}
      className={`tabular-nums transition-colors hover:text-base-fg ${className}`}
    >
      {formatTimecode(duration)}
    </button>
  );
};

export default DurationLabel;
