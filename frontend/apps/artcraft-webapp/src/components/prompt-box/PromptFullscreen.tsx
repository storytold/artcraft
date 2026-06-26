import {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Modal } from "@storyteller/ui-modal";
import { Tooltip } from "@storyteller/ui-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpRightAndDownLeftFromCenter } from "@fortawesome/pro-solid-svg-icons";

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
          <FontAwesomeIcon
            icon={faUpRightAndDownLeftFromCenter}
            className="h-3 w-3"
          />
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
}

export const PromptFullscreenModal = ({
  isOpen,
  onClose,
  children,
}: PromptFullscreenModalProps) => {
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
          editor fits the fixed panel height cleanly. No overflow-hidden here —
          the mention autocomplete dropdown renders outside the editor bounds
          and must not be clipped. */}
      <div ref={contentRef} className="flex h-full flex-col gap-2">
        <h2 className="text-lg font-bold text-base-fg">Prompt</h2>
        {/* flex column so a flex-1 editor (the MentionTextarea root wrapper)
            or an h-full textarea fills the remaining space. */}
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
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
