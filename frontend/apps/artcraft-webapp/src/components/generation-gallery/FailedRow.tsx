import { memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRotateRight,
  faCircleExclamation,
  faSpinnerThird,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { Tooltip } from "@storyteller/ui-tooltip";
import { getModelCreatorIconPath } from "../../lib/omni-gen-hooks";
import { useRecreateFromPromptToken } from "../../lib/recreate";
import { CopyPromptButton } from "./CopyPromptButton";
import type { FailedCardProps } from "./FailedCard";

export const FailedRow = memo(function FailedRow({
  id,
  failureReason,
  failureMessage,
  prompt,
  modelId,
  modelLabel,
  refImageUrl,
  promptToken,
  recreateMediaClass,
  onDismiss,
}: FailedCardProps) {
  const iconPath = modelId ? getModelCreatorIconPath(modelId) : null;
  const { isRecreating, handleRecreate } = useRecreateFromPromptToken(
    promptToken,
    recreateMediaClass,
  );

  return (
    <div className="flex items-center gap-3 rounded-lg px-2.5 py-2">
      {/* Error thumbnail — ref image (if any) faded behind the warning icon */}
      <div className="relative flex size-[100px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-red-500/10 leading-none">
        {refImageUrl && (
          <img
            src={refImageUrl}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10"
          />
        )}
        <FontAwesomeIcon
          icon={faCircleExclamation}
          className="relative text-2xl text-red-400"
        />
      </div>

      {/* Reason + prompt + model */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-red-400">
            {failureReason || "Generation failed"}
          </p>
          {prompt && <CopyPromptButton text={prompt} />}
          {promptToken && (
            <Tooltip content="Recreate" position="top">
              <button
                type="button"
                onClick={handleRecreate}
                disabled={isRecreating}
                aria-label="Recreate"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
              >
                <FontAwesomeIcon
                  icon={isRecreating ? faSpinnerThird : faArrowRotateRight}
                  className={`text-sm ${isRecreating ? "animate-spin" : ""}`}
                />
              </button>
            </Tooltip>
          )}
        </div>
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
