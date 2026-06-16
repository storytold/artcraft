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
import { useMoodboardImageEntry } from "./useMoodboardImageEntry";
import { RecenterIndicator } from "./overlays/RecenterIndicator";
import { ShortcutCheatsheet } from "./overlays/ShortcutCheatsheet";
import type { MoodboardAdapter } from "../adapter";
// import { EmptyMoodboardCTA } from "./EmptyMoodboardCTA";

interface Props {
  adapter: MoodboardAdapter;
}

export const Moodboard = ({ adapter }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const deleteSelected = useMoodboardStore((s) => s.deleteSelected);
  const setSelection = useMoodboardStore((s) => s.setSelection);
  const editingTextId = useMoodboardStore((s) => s.transient.editingTextId);
  // const isEmpty = useMoodboardStore((s) => s.rootOrder.length === 0);

  useUndoRedo(true);
  usePasteHandler(adapter, true, stageRef);
  useGalleryDropEvent(true, stageRef);
  useKeyboardShortcuts(true);
  const cheatsheetVisible = useShortcutCheatsheet();
  const { triggerUpload, triggerGallery, modals } = useMoodboardImageEntry(
    adapter,
    stageRef,
  );

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
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-ui-panel"
    >
      <MoodboardStage containerRef={containerRef} stageRef={stageRef} />
      <TextEditOverlay containerRef={containerRef} />
      <RecenterIndicator />
      <ShortcutCheatsheet visible={cheatsheetVisible} />
      {/* {isEmpty && (
        <EmptyMoodboardCTA
          onUploadClick={triggerUpload}
          onGalleryClick={triggerGallery}
        />
      )} */}
      <div className="absolute left-0 right-0 top-0 z-10">
        <MoodboardToolbar
          onUploadClick={triggerUpload}
          onGalleryClick={triggerGallery}
        />
      </div>
      {modals}
    </div>
  );
};
