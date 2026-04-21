import { useEffect, useRef } from "react";
import Konva from "konva";
import { MoodboardToolbar } from "./MoodboardToolbar";
import { MoodboardStage } from "./MoodboardStage";
import { TextEditOverlay } from "./TextEditOverlay";
import { useMoodboardStore } from "./MoodboardStore";
import { useUndoRedo } from "./interactions/useUndoRedo";
import { usePasteHandler } from "./interactions/usePasteHandler";
import { useGalleryDropEvent } from "./interactions/useGalleryDropEvent";
import { useKeyboardShortcuts } from "./interactions/useKeyboardShortcuts";
import { useShortcutCheatsheet } from "./interactions/useShortcutCheatsheet";
import { RecenterIndicator } from "./overlays/RecenterIndicator";
import { ShortcutCheatsheet } from "./overlays/ShortcutCheatsheet";

export const Moodboard = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const deleteSelected = useMoodboardStore((s) => s.deleteSelected);
  const setSelection = useMoodboardStore((s) => s.setSelection);
  const editingTextId = useMoodboardStore((s) => s.transient.editingTextId);

  useUndoRedo(true);
  usePasteHandler(true, stageRef);
  useGalleryDropEvent(true, stageRef);
  useKeyboardShortcuts(true);
  const cheatsheetVisible = useShortcutCheatsheet();

  // Delete / Backspace removes the current selection. Skip when typing in
  // an input or while a text node is in edit mode.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /input|textarea/i.test(target.tagName)) return;
      if (target && target.isContentEditable) return;
      if (editingTextId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
      } else if (e.key === "Escape") {
        setSelection([]);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [deleteSelected, setSelection, editingTextId]);

  return (
    <div className="flex h-[calc(100vh-56px)] w-screen flex-col bg-[#0b0b0e]">
      <MoodboardToolbar />
      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        <MoodboardStage containerRef={containerRef} stageRef={stageRef} />
        <TextEditOverlay containerRef={containerRef} />
        <RecenterIndicator />
        <ShortcutCheatsheet visible={cheatsheetVisible} />
      </div>
    </div>
  );
};
