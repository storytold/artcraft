import { useEffect } from "react";
import { useMoodboardStore } from "../MoodboardStore";

// Standard editor hotkeys:
// - Cmd+Z (Mac) / Ctrl+Z (Win) → undo
// - Cmd+Shift+Z (Mac), Ctrl+Y or Ctrl+Shift+Z (Win) → redo
export const useUndoRedo = (active: boolean) => {
  const undo = useMoodboardStore((s) => s.undo);
  const redo = useMoodboardStore((s) => s.redo);

  useEffect(() => {
    if (!active) return undefined;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /input|textarea/i.test(target.tagName)) return;
      if (target && target.isContentEditable) return;

      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        (isMac && k === "z" && e.shiftKey) ||
        (!isMac && k === "y") ||
        (!isMac && k === "z" && e.shiftKey)
      ) {
        e.preventDefault();
        redo();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [active, undo, redo]);
};
