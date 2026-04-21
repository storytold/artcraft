import { useEffect } from "react";
import { useMoodboardStore } from "../MoodboardStore";

const isEditableTarget = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (/input|textarea/i.test(el.tagName)) return true;
  if (el.isContentEditable) return true;
  return false;
};

// Figma-style shortcuts that aren't already wired elsewhere.
// Cmd+Z / Cmd+Shift+Z live in useUndoRedo; Cmd+0 + Space-pan live in
// useViewportControls; Delete / Escape live in Moodboard.tsx.
export const useKeyboardShortcuts = (active: boolean) => {
  const setTool = useMoodboardStore((s) => s.setTool);
  const selectAll = useMoodboardStore((s) => s.selectAll);
  const group = useMoodboardStore((s) => s.group);
  const ungroup = useMoodboardStore((s) => s.ungroup);
  const fitToContent = useMoodboardStore((s) => s.fitToContent);

  useEffect(() => {
    if (!active) return undefined;
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);

    const handler = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      // Skip while typing in the text-edit overlay (covered by isEditableTarget
      // too, but belt-and-suspenders in case the overlay loses target focus).
      if (useMoodboardStore.getState().transient.editingTextId) return;

      const mod = isMac ? e.metaKey : e.ctrlKey;
      const k = e.key.toLowerCase();

      // Modifier combos
      if (mod && !e.shiftKey && k === "a") {
        e.preventDefault();
        selectAll();
        return;
      }
      if (mod && !e.shiftKey && k === "g") {
        e.preventDefault();
        group();
        return;
      }
      if (mod && e.shiftKey && k === "g") {
        e.preventDefault();
        ungroup();
        return;
      }

      // Shift-only combos
      if (e.shiftKey && !mod && !e.altKey && k === "1") {
        e.preventDefault();
        fitToContent();
        return;
      }

      // Plain (no modifiers) tool switches — skip if any modifier is held
      // so Cmd+V (paste) etc. never triggers the Text tool.
      if (mod || e.shiftKey || e.altKey) return;
      if (k === "v") {
        e.preventDefault();
        setTool("select");
      } else if (k === "l") {
        e.preventDefault();
        setTool("lasso");
      } else if (k === "t") {
        e.preventDefault();
        setTool("text");
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [active, setTool, selectAll, group, ungroup, fitToContent]);
};
