import { memo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRotateRight,
  faCircleExclamation,
  faSpinnerThird,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { getModelCreatorIconPath } from "../../lib/omni-gen-hooks";
import { applyRecreateFromPromptToken } from "../../lib/recreate";

export interface FailedCardProps {
  id: string;
  failureReason?: string;
  failureMessage?: string;
  prompt: string;
  modelId: string;
  modelLabel: string;
  // First user-supplied still image, if any. Rendered behind the error overlay
  // at low opacity so failed cards still hint at what the user was trying to
  // generate.
  refImageUrl?: string;
  // Prompt token + media class enable the "Recreate" action. Without a prompt
  // token there's nothing to seed the create page with, so the button hides.
  promptToken?: string;
  recreateMediaClass: "image" | "video";
  onDismiss: (id: string) => void;
}

export const FailedCard = memo(function FailedCard({
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
  const navigate = useNavigate();
  const [isRecreating, setIsRecreating] = useState(false);
  const iconPath = modelId ? getModelCreatorIconPath(modelId) : null;

  const handleRecreate = useCallback(async () => {
    if (!promptToken || isRecreating) return;
    setIsRecreating(true);
    try {
      await applyRecreateFromPromptToken(
        promptToken,
        recreateMediaClass,
        navigate,
      );
    } finally {
      setIsRecreating(false);
    }
  }, [promptToken, recreateMediaClass, navigate, isRecreating]);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-red-500/10">
      {refImageUrl && (
        <img
          src={refImageUrl}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10"
        />
      )}
      <div className="relative flex h-full flex-col items-center justify-center gap-2 px-4 sm:px-6">
        <FontAwesomeIcon
          icon={faCircleExclamation}
          className="text-2xl text-red-400"
        />
        <span className="text-center text-xs font-medium text-red-400">
          {failureReason || "Generation failed"}
        </span>
        {failureMessage && failureMessage !== failureReason && (
          <span className="text-center text-[10px] max-w-md text-red-400/60 line-clamp-2 sm:line-clamp-4">
            {failureMessage}
          </span>
        )}
        <div className="mt-1 flex items-center gap-1.5">
          {promptToken && (
            <button
              type="button"
              onClick={handleRecreate}
              disabled={isRecreating}
              className="flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
            >
              <FontAwesomeIcon
                icon={isRecreating ? faSpinnerThird : faArrowRotateRight}
                className={isRecreating ? "animate-spin" : ""}
              />
              Recreate
            </button>
          )}
          <button
            type="button"
            onClick={() => onDismiss(id)}
            className="flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white/70"
          >
            <FontAwesomeIcon icon={faXmark} />
            Dismiss
          </button>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/60 to-transparent px-3 pb-2.5 pt-6 sm:block">
        <p className="truncate text-xs text-white/70">{prompt}</p>
        <div className="mt-1 flex items-center gap-1.5">
          {iconPath && (
            <img
              src={iconPath}
              alt=""
              className="h-3 w-3 flex-shrink-0 icon-auto-contrast"
            />
          )}
          <p className="truncate text-[10px] text-white/40">{modelLabel}</p>
        </div>
      </div>
    </div>
  );
});
