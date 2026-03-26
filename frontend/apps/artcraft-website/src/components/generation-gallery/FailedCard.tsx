import { memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";

export interface FailedCardProps {
  id: string;
  failureReason?: string;
  failureMessage?: string;
  prompt: string;
  modelLabel: string;
  onDismiss: (id: string) => void;
}

export const FailedCard = memo(function FailedCard({
  id,
  failureReason,
  failureMessage,
  prompt,
  modelLabel,
  onDismiss,
}: FailedCardProps) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-red-500/10">
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4">
        <FontAwesomeIcon
          icon={faCircleExclamation}
          className="text-2xl text-red-400"
        />
        <span className="text-center text-xs font-medium text-red-400">
          {failureReason || "Generation failed"}
        </span>
        {failureMessage && failureMessage !== failureReason && (
          <span className="text-center text-[10px] text-red-400/60 line-clamp-2">
            {failureMessage}
          </span>
        )}
        <button
          onClick={() => onDismiss(id)}
          className="mt-1 flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white/70"
        >
          <FontAwesomeIcon icon={faXmark} />
          Dismiss
        </button>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2.5 pt-6">
        <p className="truncate text-xs text-white/70">{prompt}</p>
        <p className="truncate text-[10px] text-white/40">{modelLabel}</p>
      </div>
    </div>
  );
});
