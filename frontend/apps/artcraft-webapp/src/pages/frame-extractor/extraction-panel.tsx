import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faChevronDown,
  faLayerGroup,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import { EASE_EMPHASIS } from "../../lib/motion";
import { formatTime, formatTimePrecise } from "./lib/frame-actions";

interface ExtractionPanelProps {
  currentTime: number;
  duration: number;
  resolution: { w: number; h: number } | null;
  numFrames: number;
  spacingMs: number;
  onNumFramesChange: (value: number) => void;
  onSpacingChange: (value: number) => void;
  isExtracting: boolean;
  progress: { done: number; total: number } | null;
  onCaptureCurrent: () => void;
  onExtractBurst: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export const ExtractionPanel = ({
  currentTime,
  duration,
  resolution,
  numFrames,
  spacingMs,
  onNumFramesChange,
  onSpacingChange,
  isExtracting,
  progress,
  onCaptureCurrent,
  onExtractBurst,
  onCancel,
  disabled,
}: ExtractionPanelProps) => {
  const [burstOpen, setBurstOpen] = useState(false);

  // Burst timing math needs a real duration; live/streamed sources report
  // Infinity and capture-current is the only mode that still makes sense.
  const burstAvailable = Number.isFinite(duration) && duration > 0;

  return (
    <div className="flex h-fit flex-col divide-y divide-ui-divider rounded-xl border border-ui-panel-border bg-ui-panel">
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-base-fg/50">
          <span>Playhead</span>
          <span className="font-mono text-xs normal-case tracking-normal text-base-fg/80">
            {disabled ? "--:--.---" : formatTimePrecise(currentTime)}
          </span>
        </div>
        <Button
          variant="primary"
          icon={faCamera}
          onClick={onCaptureCurrent}
          disabled={disabled || isExtracting}
          className="w-full py-2 text-sm font-medium"
        >
          Capture frame
        </Button>
        <div className="text-center text-[11px] text-base-fg/40">
          {disabled ? "Load a video to start" : "Press C or Enter to capture"}
        </div>
      </div>

      <div>
        <button
          onClick={() => setBurstOpen((open) => !open)}
          disabled={disabled || !burstAvailable}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-base-fg/75 transition-colors hover:text-base-fg disabled:cursor-default disabled:opacity-40"
        >
          <span className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faLayerGroup}
              className="text-xs text-base-fg/40"
            />
            Burst capture
          </span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`text-xs text-base-fg/40 transition-transform ${burstOpen ? "rotate-180" : ""}`}
          />
        </button>
        <AnimatePresence initial={false}>
          {burstOpen && !disabled && burstAvailable && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE_EMPHASIS }}
              className="overflow-hidden"
            >
              <div className="space-y-3 px-4 pb-4">
                <p className="text-xs leading-relaxed text-base-fg/50">
                  Captures a sequence of frames from the playhead — useful for
                  finding the sharpest one.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-medium text-base-fg/55">
                      Frames
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={numFrames}
                      disabled={isExtracting}
                      onChange={(e) =>
                        onNumFramesChange(
                          Math.max(1, Math.min(50, parseInt(e.target.value) || 1)),
                        )
                      }
                      className="w-full rounded-md border border-ui-controls-border bg-ui-controls px-2.5 py-1.5 text-sm text-base-fg focus:border-primary focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-medium text-base-fg/55">
                      Spacing (ms)
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={spacingMs}
                      disabled={isExtracting}
                      onChange={(e) =>
                        onSpacingChange(
                          Math.max(1, Math.min(10000, parseInt(e.target.value) || 1)),
                        )
                      }
                      className="w-full rounded-md border border-ui-controls-border bg-ui-controls px-2.5 py-1.5 text-sm text-base-fg focus:border-primary focus:outline-none"
                    />
                  </label>
                </div>
                {isExtracting && progress ? (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${(progress.done / progress.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-base-fg/60">
                      {progress.done}/{progress.total}
                    </span>
                    <button
                      onClick={onCancel}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-base-fg/50 transition-colors hover:bg-white/10 hover:text-base-fg"
                      aria-label="Cancel extraction"
                    >
                      <FontAwesomeIcon icon={faXmark} className="text-xs" />
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="action"
                    onClick={onExtractBurst}
                    disabled={isExtracting}
                    className="w-full py-1.5 text-sm font-medium"
                  >
                    Extract {numFrames} {numFrames === 1 ? "frame" : "frames"}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-1.5 p-4 text-xs text-base-fg/45">
        <div className="flex items-center justify-between">
          <span>Duration</span>
          <span className="font-mono text-base-fg/70">
            {!disabled && Number.isFinite(duration) ? formatTime(duration) : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Resolution</span>
          <span className="font-mono text-base-fg/70">
            {!disabled && resolution ? `${resolution.w} × ${resolution.h}` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
};
