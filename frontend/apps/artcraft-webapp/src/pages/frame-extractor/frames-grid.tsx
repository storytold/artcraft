import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDownToLine,
  faCheck,
  faImage,
  faSave,
  faSpinnerThird,
  faVideo,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Tooltip } from "@storyteller/ui-tooltip";
import { EASE_EMPHASIS } from "../../lib/motion";
import type { ExtractedFrame } from "./lib/extract-frames";
import { formatTimePrecise } from "./lib/frame-actions";

export interface FrameActionState {
  saving?: boolean;
  saved?: boolean;
  sending?: boolean;
}

interface FramesGridProps {
  frames: ExtractedFrame[];
  actionState: Record<string, FrameActionState>;
  onUseAsImageRef: (frame: ExtractedFrame) => void;
  onUseForVideo: (frame: ExtractedFrame) => void;
  onSave: (frame: ExtractedFrame) => void;
  onDownload: (frame: ExtractedFrame) => void;
  onRemove: (frame: ExtractedFrame) => void;
  onSaveAll: () => void;
  isSavingAll: boolean;
  onClear: () => void;
}

export const FramesGrid = ({
  frames,
  actionState,
  onUseAsImageRef,
  onUseForVideo,
  onSave,
  onDownload,
  onRemove,
  onSaveAll,
  isSavingAll,
  onClear,
}: FramesGridProps) => {
  if (frames.length === 0) return null;

  const hasUnsaved = frames.some((frame) => !actionState[frame.id]?.saved);

  return (
    <div className="rounded-xl border border-ui-panel-border bg-ui-panel p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-base-fg">
          Captured frames
          <span className="ml-2 font-normal text-base-fg/40">
            {frames.length}
          </span>
        </h3>
        <div className="flex items-center gap-1">
          {hasUnsaved && (
            <button
              onClick={onSaveAll}
              disabled={isSavingAll}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-base-fg/70 transition-colors hover:bg-white/5 hover:text-base-fg disabled:opacity-50"
            >
              <FontAwesomeIcon
                icon={isSavingAll ? faSpinnerThird : faSave}
                className={isSavingAll ? "animate-spin" : ""}
              />
              {isSavingAll ? "Saving…" : "Save all"}
            </button>
          )}
          <button
            onClick={onClear}
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-base-fg/50 transition-colors hover:bg-white/5 hover:text-base-fg"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence initial={false}>
          {frames.map((frame) => {
            const state = actionState[frame.id] ?? {};
            return (
              <motion.div
                key={frame.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18, ease: EASE_EMPHASIS }}
                className="group/frame overflow-hidden rounded-lg border border-ui-panel-border bg-ui-background"
              >
                <div className="relative aspect-video bg-black">
                  <img
                    src={frame.objectUrl}
                    alt={`Frame at ${formatTimePrecise(frame.timestamp)}`}
                    className="h-full w-full object-contain"
                  />
                  <button
                    onClick={() => onRemove(frame)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white/60 opacity-0 backdrop-blur-sm transition-all hover:text-white group-hover/frame:opacity-100"
                    aria-label="Remove frame"
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-xs" />
                  </button>
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white/85 backdrop-blur-sm">
                    {formatTimePrecise(frame.timestamp)}
                  </span>
                </div>
                <div className="flex items-center justify-around border-t border-ui-panel-border/60 p-1">
                  <FrameAction
                    icon={faImage}
                    tooltip="Use as image reference"
                    onClick={() => onUseAsImageRef(frame)}
                    loading={state.sending}
                  />
                  <FrameAction
                    icon={faVideo}
                    tooltip="Animate into a video"
                    onClick={() => onUseForVideo(frame)}
                    loading={state.sending}
                  />
                  <FrameAction
                    icon={state.saved ? faCheck : faSave}
                    tooltip={state.saved ? "Saved to library" : "Save to library"}
                    onClick={() => onSave(frame)}
                    loading={state.saving}
                    disabled={state.saved}
                    success={state.saved}
                  />
                  <FrameAction
                    icon={faArrowDownToLine}
                    tooltip="Download PNG"
                    onClick={() => onDownload(frame)}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface FrameActionProps {
  icon: IconDefinition;
  tooltip: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  success?: boolean;
}

const FrameAction = ({
  icon,
  tooltip,
  onClick,
  loading,
  disabled,
  success,
}: FrameActionProps) => (
  // fixed strategy: the card is overflow-hidden (rounded corners), which
  // would clip an absolutely-positioned tooltip.
  <Tooltip content={tooltip} position="top" strategy="fixed" className="z-50">
    <button
      onClick={onClick}
      disabled={loading || disabled}
      aria-label={tooltip}
      className={`flex h-7 w-8 items-center justify-center rounded-md text-xs transition-colors disabled:cursor-default ${
        success
          ? "text-green"
          : "text-base-fg/60 hover:bg-white/5 hover:text-base-fg"
      }`}
    >
      <FontAwesomeIcon
        icon={loading ? faSpinnerThird : icon}
        className={loading ? "animate-spin" : ""}
      />
    </button>
  </Tooltip>
);
