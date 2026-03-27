import { useEffect } from "react";

interface UseCopyPasteHotkeysProps {
  onCopy: () => void;
  onPaste: () => void;
  // Optional: to disable hotkeys when an input is focused
  disableWhenInputFocused?: boolean;
}

export const useCopyPasteHotkeys = ({
  onCopy,
  onPaste,
  disableWhenInputFocused = true,
}: UseCopyPasteHotkeysProps): void => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disableWhenInputFocused) {
        const target = event.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return; // Ignore if typing in an input, textarea, etc.
        }
      }

      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const isC = event.key.toLowerCase() === "c";
      const isV = event.key.toLowerCase() === "v";

      // Copy: Cmd+C (Mac) or Ctrl+C (Windows/Linux)
      const isCopy =
        (isMac ? event.metaKey : event.ctrlKey) && isC && !event.shiftKey;

      // Paste: Cmd+V (Mac) or Ctrl+V (Windows/Linux)
      const isPaste =
        (isMac ? event.metaKey : event.ctrlKey) && isV && !event.shiftKey;

      if (isCopy) {
        event.preventDefault();
        console.log("Copy action triggered");
        onCopy();
      } else if (isPaste) {
        event.preventDefault();
        console.log("Paste action triggered");
        onPaste();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCopy, onPaste, disableWhenInputFocused]);
};
