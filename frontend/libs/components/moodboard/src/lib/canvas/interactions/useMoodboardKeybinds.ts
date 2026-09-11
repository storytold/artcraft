import { useEffect } from "react";
import {
  isEventFromEditableElement,
  useResolvedKeybinds,
} from "@storyteller/keybinds";
import { useMoodboardStore } from "../MoodboardStore";

// Unified moodboard keyboard handling, resolved from the shared keybinds store
// so Settings → Keybinds can rebind these. Replaces the previous trio of
// hardcoded hooks (useKeyboardShortcuts / useUndoRedo + the inline delete/escape
// handler in Moodboard.tsx). Pan/zoom remain mouse/space gestures in
// useViewportControls; clipboard paste stays in usePasteHandler.
export const useMoodboardKeybinds = (active: boolean) => {
  const setTool = useMoodboardStore((s) => s.setTool);
  const selectAll = useMoodboardStore((s) => s.selectAll);
  const setSelection = useMoodboardStore((s) => s.setSelection);
  const group = useMoodboardStore((s) => s.group);
  const ungroup = useMoodboardStore((s) => s.ungroup);
  const fitToContent = useMoodboardStore((s) => s.fitToContent);
  const resetViewport = useMoodboardStore((s) => s.resetViewport);
  const deleteSelected = useMoodboardStore((s) => s.deleteSelected);
  const undo = useMoodboardStore((s) => s.undo);
  const redo = useMoodboardStore((s) => s.redo);

  const { matchAction } = useResolvedKeybinds();

  useEffect(() => {
    if (!active) return undefined;

    const handler = (e: KeyboardEvent) => {
      if (isEventFromEditableElement(e)) return;
      if (useMoodboardStore.getState().transient.editingTextId) return;

      const action = matchAction(e, "moodboard");
      if (!action) return;
      e.preventDefault();
      switch (action) {
        case "moodboard.tools.select":
          setTool("select");
          break;
        case "moodboard.tools.lasso":
          setTool("lasso");
          break;
        case "moodboard.tools.text":
          setTool("text");
          break;
        case "moodboard.selection.selectAll":
          selectAll();
          break;
        case "moodboard.selection.clear":
          setSelection([]);
          break;
        case "moodboard.edit.delete":
          deleteSelected();
          break;
        case "moodboard.edit.group":
          group();
          break;
        case "moodboard.edit.ungroup":
          ungroup();
          break;
        case "moodboard.view.fitToContent":
          fitToContent();
          break;
        case "moodboard.view.resetViewport":
          resetViewport();
          break;
        case "moodboard.history.undo":
          undo();
          break;
        case "moodboard.history.redo":
          redo();
          break;
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [
    active,
    matchAction,
    setTool,
    selectAll,
    setSelection,
    group,
    ungroup,
    fitToContent,
    resetViewport,
    deleteSelected,
    undo,
    redo,
  ]);
};
