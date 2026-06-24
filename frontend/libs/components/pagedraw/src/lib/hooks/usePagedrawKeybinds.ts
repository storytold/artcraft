import { useEffect } from "react";
import {
  isEventFromEditableElement,
  useResolvedKeybinds,
} from "@storyteller/keybinds";

// Unified 2D-editor keyboard handling, resolved from the shared keybinds store
// (so Settings → Keybinds can rebind these). Replaces the three ad-hoc hooks
// (useUndoRedoHotkeys / useCopyPasteHotkeys / useDeleteHotkeys).
export interface PagedrawKeybindHandlers {
  undo: () => void;
  redo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
}

export const usePagedrawKeybinds = (handlers: PagedrawKeybindHandlers): void => {
  const { matchAction } = useResolvedKeybinds();
  const { undo, redo, onCopy, onPaste, onDelete } = handlers;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEventFromEditableElement(e)) return;
      const action = matchAction(e, "pagedraw");
      if (!action) return;
      e.preventDefault();
      switch (action) {
        case "pagedraw.history.undo":
          undo();
          break;
        case "pagedraw.history.redo":
          redo();
          break;
        case "pagedraw.edit.copy":
          onCopy();
          break;
        case "pagedraw.edit.paste":
          onPaste();
          break;
        case "pagedraw.edit.delete":
          onDelete();
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [matchAction, undo, redo, onCopy, onPaste, onDelete]);
};
