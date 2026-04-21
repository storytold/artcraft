import { forwardRef, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus, faXmark } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { MentionTextarea, type MentionItem } from "./MentionTextarea";
import {
  MULTISHOT_MAX_TOTAL_SECONDS,
  MULTISHOT_MIN_SHOT_SECONDS,
  MultishotShot,
} from "./promptStore";

interface MultishotPromptEditorProps {
  shots: MultishotShot[];
  activeShotId: string | null;
  onSelectShot: (id: string) => void;
  onAddShot: () => void;
  onRemoveShot: (id: string) => void;
  onUpdateShot: (id: string, patch: Partial<Omit<MultishotShot, "id">>) => void;
  onPromptKeyEnter?: () => void;

  // Optional @-mention support for per-shot prompt editors. When these are
  // provided the per-shot textarea is replaced with the mention-aware
  // contentEditable editor, reusing the same mention/color wiring as the
  // single-prompt flow.
  mentionItems?: MentionItem[];
  mentionColorMap?: Record<string, string>;
}

export const MultishotPromptEditor = forwardRef<
  HTMLDivElement,
  MultishotPromptEditorProps
>(function MultishotPromptEditor(
  {
    shots,
    activeShotId,
    onSelectShot,
    onAddShot,
    onRemoveShot,
    onUpdateShot,
    onPromptKeyEnter,
    mentionItems,
    mentionColorMap,
  },
  ref,
) {
  const activeShot = useMemo(
    () => shots.find((s) => s.id === activeShotId) ?? shots[0] ?? null,
    [shots, activeShotId],
  );

  const totalSeconds = useMemo(
    () => shots.reduce((sum, s) => sum + s.durationSeconds, 0),
    [shots],
  );
  const remaining = Math.max(0, MULTISHOT_MAX_TOTAL_SECONDS - totalSeconds);
  const canAddMore = remaining >= MULTISHOT_MIN_SHOT_SECONDS;

  const adjustActiveDuration = (delta: number) => {
    if (!activeShot) return;
    onUpdateShot(activeShot.id, {
      durationSeconds: activeShot.durationSeconds + delta,
    });
  };

  const canDecrement =
    !!activeShot && activeShot.durationSeconds > MULTISHOT_MIN_SHOT_SECONDS;
  // Incrementing by 1 is only allowed if there's at least 1 second of total
  // headroom remaining.
  const canIncrement = !!activeShot && remaining >= 1;

  const hasMentions = !!mentionItems && mentionItems.length > 0;

  return (
    <div ref={ref} className="flex flex-col">
      {/* Shot tabs + total indicator */}
      <div className="mb-2 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pr-2">
          {shots.map((shot, i) => {
            const isActive = shot.id === (activeShot?.id ?? activeShotId);
            return (
              <button
                key={shot.id}
                type="button"
                onClick={() => onSelectShot(shot.id)}
                className={twMerge(
                  "group flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-1 text-sm transition-colors",
                  isActive
                    ? "border-primary/70 bg-primary/10 text-base-fg"
                    : "border-ui-controls-border bg-ui-controls/60 text-base-fg/80 hover:bg-ui-controls",
                )}
              >
                <span className="font-medium">Shot {i + 1}</span>
                <span
                  className={twMerge(
                    "rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
                    isActive
                      ? "bg-primary/25 text-primary"
                      : "bg-ui-controls text-base-fg/70",
                  )}
                >
                  {shot.durationSeconds}s
                </span>
                {isActive && shots.length > 1 && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveShot(shot.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemoveShot(shot.id);
                      }
                    }}
                    className="-mr-0.5 flex h-4 w-4 items-center justify-center rounded-sm text-base-fg/50 hover:bg-black/20 hover:text-base-fg"
                    aria-label={`Remove shot ${i + 1}`}
                  >
                    <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
                  </span>
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={onAddShot}
            disabled={!canAddMore}
            aria-label="Add shot"
            className={twMerge(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ui-controls-border text-base-fg/70 transition-colors",
              canAddMore
                ? "hover:bg-ui-controls hover:text-base-fg"
                : "cursor-not-allowed opacity-40",
            )}
          >
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
          </button>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-base-fg/60">
          {totalSeconds}s / {MULTISHOT_MAX_TOTAL_SECONDS}s
          {remaining > 0 && (
            <span className="ml-1 text-base-fg/40">({remaining}s left)</span>
          )}
        </span>
      </div>

      {/* Duration stepper for active shot */}
      {activeShot && (
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs text-base-fg/60">Duration:</span>
          <button
            type="button"
            onClick={() => adjustActiveDuration(-1)}
            disabled={!canDecrement}
            aria-label="Decrease shot duration"
            className={twMerge(
              "flex h-6 w-6 items-center justify-center rounded-md border border-ui-controls-border text-base-fg/70 transition-colors",
              canDecrement
                ? "hover:bg-ui-controls hover:text-base-fg"
                : "cursor-not-allowed opacity-40",
            )}
          >
            <FontAwesomeIcon icon={faMinus} className="h-2.5 w-2.5" />
          </button>
          <span className="min-w-6 text-center text-sm font-semibold tabular-nums text-primary">
            {activeShot.durationSeconds}s
          </span>
          <button
            type="button"
            onClick={() => adjustActiveDuration(1)}
            disabled={!canIncrement}
            aria-label="Increase shot duration"
            className={twMerge(
              "flex h-6 w-6 items-center justify-center rounded-md border border-ui-controls-border text-base-fg/70 transition-colors",
              canIncrement
                ? "hover:bg-ui-controls hover:text-base-fg"
                : "cursor-not-allowed opacity-40",
            )}
          >
            <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" />
          </button>
        </div>
      )}

      {/* Per-shot prompt editor */}
      {activeShot &&
        (hasMentions ? (
          <MentionTextarea
            key={activeShot.id}
            value={activeShot.prompt}
            onChange={(value) => onUpdateShot(activeShot.id, { prompt: value })}
            mentionItems={mentionItems ?? []}
            colorMap={mentionColorMap ?? {}}
            placeholder="Describe what happens in this shot..."
            className="promptbox-scrollbar text-md relative mb-2 min-h-[2.5em] w-full resize-y overflow-y-auto rounded bg-transparent pb-2 pr-2 pt-1 text-base-fg"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onPromptKeyEnter?.();
              }
            }}
          />
        ) : (
          <textarea
            key={activeShot.id}
            rows={1}
            placeholder="Describe what happens in this shot..."
            className="promptbox-scrollbar text-md relative mb-2 min-h-[2.5em] w-full resize-y overflow-y-auto rounded bg-transparent pb-2 pr-2 pt-1 text-base-fg placeholder-base-fg/60 focus:outline-none"
            value={activeShot.prompt}
            onChange={(e) =>
              onUpdateShot(activeShot.id, { prompt: e.target.value })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onPromptKeyEnter?.();
              }
            }}
          />
        ))}
    </div>
  );
});
