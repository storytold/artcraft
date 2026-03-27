import { useEffect } from "react";

interface UndoRedoHotkeysProps {
  undo: () => void;
  redo: () => void;
  target?: Document | HTMLElement; // Optional target, defaults to document
}

export const useUndoRedoHotkeys = ({
  undo,
  redo,
  target = document,
}: UndoRedoHotkeysProps): void => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const isZ = event.key.toLowerCase() === "z";
      const isY = event.key.toLowerCase() === "y";

      const isUndo =
        (isMac ? event.metaKey : event.ctrlKey) && isZ && !event.shiftKey;

      // Redo conditions:
      // 1. Mac: Cmd + Shift + Z
      // 2. Windows/Linux: Ctrl + Y
      // 3. Windows/Linux (alternative): Ctrl + Shift + Z
      const isRedoMac = isMac && event.metaKey && event.shiftKey && isZ;
      const isRedoWinY = !isMac && event.ctrlKey && isY;
      const isRedoWinShiftZ = !isMac && event.ctrlKey && event.shiftKey && isZ;

      if (isUndo) {
        event.preventDefault();
        console.log("Undo action triggered");
        undo();
      } else if (isRedoMac || isRedoWinY || isRedoWinShiftZ) {
        event.preventDefault();
        console.log("Redo action triggered");
        redo();
      }
    };

    const currentTarget = target || document;
    // Ensure 'keydown' is used as some systems might not fire 'keypress' for Ctrl/Cmd combinations
    currentTarget.addEventListener("keydown", handleKeyDown as EventListener);

    return () => {
      currentTarget.removeEventListener(
        "keydown",
        handleKeyDown as EventListener,
      );
    };
  }, [undo, redo, target]); // Re-run effect if callbacks or target change
};
