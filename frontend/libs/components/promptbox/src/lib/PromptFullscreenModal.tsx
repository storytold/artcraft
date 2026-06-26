import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { focusEditorAtEnd } from "./focusEditorAtEnd";

// Shared "focus mode" overlay for prompt editors. Reuses @storyteller/ui-modal
// (Trello-card style: centered panel + blurred backdrop) and renders whatever
// editor the caller passes — a fresh textarea / MentionTextarea instance bound
// to the SAME store value + onChange, so text and mentions stay continuous
// across open/close (only the caret resets, as expected for a new instance).

interface PromptFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Current prompt length, for the character counter. */
  promptLength: number;
  /** Max prompt length (Infinity for unlimited). */
  maxLength: number;
  /**
   * The editor to render inside the overlay. Pass a fresh textarea /
   * MentionTextarea bound to the same value + onChange as the inline one.
   */
  children: ReactNode;
  /**
   * Optional controls rendered in the footer, left of the Done button — e.g.
   * the model selector + character button. The caller composes these from its
   * own toolbar pieces.
   */
  footerControls?: ReactNode;
  /**
   * Optional reference-image row rendered above the footer, always visible in
   * focus mode regardless of the inline row's collapse state.
   */
  imagePromptRow?: ReactNode;
}

export const PromptFullscreenModal = ({
  isOpen,
  onClose,
  promptLength,
  maxLength,
  children,
  footerControls,
  imagePromptRow,
}: PromptFullscreenModalProps) => {
  const overLimit = isFinite(maxLength) && promptLength > maxLength;
  const contentRef = useRef<HTMLDivElement>(null);

  // Focus the editor and drop the caret at the end once the overlay opens.
  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => focusEditorAtEnd(contentRef.current), 60);
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
          lets the editor's textarea scroll instead of stretching the panel.
          min-h-0 on the flex children lets them shrink below content size. */}
      <div className="flex min-h-0 flex-col gap-2" style={{ height: "70vh" }}>
        <h2 className="shrink-0 text-lg font-bold text-base-fg">Prompt</h2>
        {/* flex-1 so the editor takes only the space left after the (shrink-0)
            image row + footer — that's what keeps it from overflowing when the
            window is shorter. min-h-0 + overflow-hidden bound the editor area so
            its own textarea scrolls instead of pushing the layout. */}
        <div
          ref={contentRef}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          {children}
        </div>
        <div className="flex shrink-0 items-center justify-end">
          <span
            className={`text-[11px] tabular-nums ${
              overLimit ? "text-red-500" : "text-base-fg/40"
            }`}
          >
            {promptLength} / {isFinite(maxLength) ? maxLength : "∞"}
          </span>
        </div>
        {imagePromptRow && <div className="shrink-0">{imagePromptRow}</div>}
        <div className="flex shrink-0 items-center justify-between gap-2">
          <div className="flex items-center gap-2">{footerControls}</div>
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  );
};

/** Holds open/close state for a prompt's fullscreen focus mode. */
export function useFullscreenPrompt() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const openFullscreen = useCallback(() => setIsFullscreen(true), []);
  const closeFullscreen = useCallback(() => setIsFullscreen(false), []);
  return { isFullscreen, openFullscreen, closeFullscreen };
}
