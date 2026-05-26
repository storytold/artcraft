import { memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation, faXmark } from "@fortawesome/pro-solid-svg-icons";
import { getModelCreatorIconPath } from "../../lib/omni-gen-hooks";
import type { FailedCardProps } from "./FailedCard";

export const FailedRow = memo(function FailedRow({
  id,
  failureReason,
  failureMessage,
  prompt,
  modelId,
  modelLabel,
  onDismiss,
}: FailedCardProps) {
  const iconPath = modelId ? getModelCreatorIconPath(modelId) : null;

  return (
    <div className="flex items-center gap-3 rounded-lg px-2.5 py-2">
      {/* Error thumbnail */}
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-red-500/10 leading-none">
        <FontAwesomeIcon
          icon={faCircleExclamation}
          className="text-lg text-red-400"
        />
      </div>

      {/* Reason + prompt + model */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-red-400">
          {failureReason || "Generation failed"}
        </p>
        {prompt && (
          <p className="mt-0.5 truncate text-xs text-white/45">{prompt}</p>
        )}
        <div className="mt-1 flex items-center gap-1.5 text-xs text-white/40">
          {iconPath && (
            <img
              src={iconPath}
              alt=""
              className="h-3 w-3 shrink-0 icon-auto-contrast"
            />
          )}
          <span className="truncate">{modelLabel}</span>
          {failureMessage && failureMessage !== failureReason && (
            <>
              <span className="text-white/20">·</span>
              <span className="truncate text-red-400/60">{failureMessage}</span>
            </>
          )}
        </div>
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="flex shrink-0 items-center gap-1.5 rounded-md bg-white/5 px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white/70"
      >
        <FontAwesomeIcon icon={faXmark} />
        Dismiss
      </button>
    </div>
  );
});
