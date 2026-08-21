import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { Maximize2Icon } from "lucide-react";

// Webapp "focus mode" for the prompt editor. Mirrors the desktop lib's
// (@storyteller/ui-promptbox) fullscreen feature but lives here because the
// webapp has its own PromptBox. Reuses the shared @storyteller/ui-modal for a
// Trello-card-style centered panel + blurred backdrop. The overlay renders a
// fresh editor bound to the SAME value + onChange, so text/mentions stay
// continuous across open/close.

// ── Expand button ────────────────────────────────────────────────────────

interface PromptFullscreenButtonProps {
  onClick: () => void;
  className?: string;
}

export const PromptFullscreenButton = ({
  onClick,
  className,
}: PromptFullscreenButtonProps) => {
  // Absolute positioning lives on the outer wrapper, not the button: Tooltip
  // wraps its child in its own relative div, so positioning the button directly
  // would anchor it to that wrapper and land it in the wrong spot.
  return (
    <div className={`absolute right-0 top-0 z-10 ${className ?? ""}`}>
      <Tooltip content="Focus mode" position="top" delay={200}>
        <button
          type="button"
          aria-label="Expand prompt to focus mode"
          onClick={onClick}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-base-fg/5 text-base-fg/50 transition-colors hover:bg-base-fg/10 hover:text-base-fg/90 focus:outline-none"
        >
          <Maximize2Icon
            
            className="h-3 w-3" />
        </button>
      </Tooltip>
    </div>
  );
};

// ── Fullscreen modal ─────────────────────────────────────────────────────

interface PromptFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Current prompt length, shown with the counter when a limit is set. */
  promptLength?: number;
  /** Soft prompt-length limit; undefined hides the counter entirely. */
  maxPromptLength?: number;
  /** Controls rendered in the footer, left of the Done button (e.g. the model
   *  selector + character button). */
  footerControls?: ReactNode;
  /** Reference-image row, always shown in focus mode. */
  imagePromptRow?: ReactNode;
  /** Clear-all control rendered on the footer's right side, left of Done. */
  clearAllButton?: ReactNode;
}

export const PromptFullscreenModal = ({
  isOpen,
  onClose,
  children,
  promptLength,
  maxPromptLength,
  footerControls,
  imagePromptRow,
  clearAllButton,
}: PromptFullscreenModalProps) => {
  const showCounter =
    promptLength !== undefined && maxPromptLength !== undefined;
  const overLimit =
    showCounter && isFinite(maxPromptLength) && promptLength > maxPromptLength;
  const contentRef = useRef<HTMLDivElement>(null);

  // Focus the editor and drop the caret at the end once the overlay opens.
  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(
      () => focusEditorAtEnd(contentRef.current),
      60,
    );
    return () => window.clearTimeout(id);
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      accessibleTitle="Prompt focus mode"
      closeOnOutsideClick
      closeOnEsc
      className="w-full max-w-4xl"
      backdropClassName="backdrop-blur-md"
    >
      {/* Explicit inline height (not a Tailwind arbitrary class) so the column
          is reliably bounded across the modal's nested wrappers — that's what
          lets the editor scroll instead of stretching the panel. min-h-0 lets
          the flex children shrink below content size. */}
      <div className="flex min-h-0 flex-col gap-2" style={{ height: "70vh" }}>
        <h2 className="shrink-0 text-lg font-bold text-base-fg">Prompt</h2>
        {/* flex-1 so the editor takes only the space left after the (shrink-0)
            image row + footer — keeps it from overflowing when the window is
            shorter. min-h-0 + overflow-hidden bound the editor area so its own
            textarea scrolls instead of pushing the layout. */}
        <div
          ref={contentRef}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          {children}
        </div>
        {showCounter && (
          <div className="flex shrink-0 items-center justify-end">
            <span
              className={`text-[11px] tabular-nums ${
                overLimit ? "text-red-500" : "text-base-fg/40"
              }`}
            >
              {promptLength} /{" "}
              {isFinite(maxPromptLength) ? maxPromptLength : "∞"}
            </span>
          </div>
        )}
        {imagePromptRow && <div className="shrink-0">{imagePromptRow}</div>}
        <div className="flex shrink-0 items-center justify-between gap-2 mt-1">
          <div className="flex items-center gap-2">{footerControls}</div>
          <div className="flex items-center gap-2">
            {clearAllButton}
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Focuses the first prompt editor inside `container` and places the caret at
// the end of its content. Handles both a plain <textarea> and a contentEditable
// div (the MentionTextarea), since the overlay can hold either.
function focusEditorAtEnd(container: HTMLElement | null): void {
  if (!container) return;

  const textarea = container.querySelector("textarea");
  if (textarea) {
    textarea.focus();
    const end = textarea.value.length;
    textarea.setSelectionRange(end, end);
    return;
  }

  const editable = container.querySelector<HTMLElement>(
    '[contenteditable="true"]',
  );
  if (editable) {
    editable.focus();
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(editable);
    range.collapse(false); // collapse to the end
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

// ── State hook ───────────────────────────────────────────────────────────

export function useFullscreenPrompt() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const openFullscreen = useCallback(() => setIsFullscreen(true), []);
  const closeFullscreen = useCallback(() => setIsFullscreen(false), []);
  return { isFullscreen, openFullscreen, closeFullscreen };
}
