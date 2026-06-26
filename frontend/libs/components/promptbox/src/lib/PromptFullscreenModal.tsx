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
      className="h-[70vh] w-full max-w-4xl"
      backdropClassName="backdrop-blur-md"
    >
      {/* Title lives inside the flex column (not the Modal title slot) so the
          editor + counter fit the fixed panel height cleanly. No overflow-hidden
          here — the mention autocomplete dropdown renders outside the editor
          bounds and must not be clipped. */}
      <div className="flex h-full flex-col gap-2">
        <h2 className="text-lg font-bold text-base-fg">Prompt</h2>
        {/* flex column so a flex-1 editor (the MentionTextarea root wrapper)
            or an h-full textarea fills the remaining space. */}
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
