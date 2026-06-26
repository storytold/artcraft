import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "@storyteller/ui-modal";
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
}

export const PromptFullscreenModal = ({
  isOpen,
  onClose,
  promptLength,
  maxLength,
  children,
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
          min-h-0 on the flex children lets them shrink below content size. No
          overflow-hidden on the editor holder — the mention autocomplete
          dropdown renders outside it and must not be clipped; the editor scrolls
          via its own overflow-y-auto. */}
      <div
        className="flex min-h-0 flex-col gap-2"
        style={{ height: "70vh" }}
      >
        <h2 className="shrink-0 text-lg font-bold text-base-fg">Prompt</h2>
        {/* flex-col so a flex-1 editor (MentionTextarea root) fills it; min-h-0
            so the editor area can shrink and its content scrolls. */}
        <div ref={contentRef} className="flex min-h-0 flex-1 flex-col">
          {children}
        </div>
        <div className="flex items-center justify-end">
          <span
            className={`text-[11px] tabular-nums ${
              overLimit ? "text-red-500" : "text-base-fg/40"
            }`}
          >
            {promptLength} / {isFinite(maxLength) ? maxLength : "∞"}
          </span>
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
