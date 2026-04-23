import { useEffect, useRef } from "react";
import { MoodboardToolbar } from "../PageMoodboard/MoodboardToolbar";
import { useMoodboardStore } from "../PageMoodboard/MoodboardStore";
import { useUndoRedo } from "../PageMoodboard/interactions/useUndoRedo";
import { useKeyboardShortcuts } from "../PageMoodboard/interactions/useKeyboardShortcuts";
import { useShortcutCheatsheet } from "../PageMoodboard/interactions/useShortcutCheatsheet";
import { RecenterIndicator } from "../PageMoodboard/overlays/RecenterIndicator";
import { ShortcutCheatsheet } from "../PageMoodboard/overlays/ShortcutCheatsheet";
import { MoodboardHtmlStage } from "./MoodboardHtmlStage";
import { useHtmlPasteHandler } from "./interactions/useHtmlPasteHandler";
import { useHtmlGalleryDropEvent } from "./interactions/useHtmlGalleryDropEvent";
import { useHtmlMoodboardImageEntry } from "./interactions/useHtmlMoodboardImageEntry";

// HTML-only variant of the moodboard. Shares the Zustand store with the Konva
// version in ../PageMoodboard, so nodes/selection/viewport persist when the
// user flips between the two experiment tabs.
export const MoodboardHtml = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const deleteSelected = useMoodboardStore((s) => s.deleteSelected);
  const setSelection = useMoodboardStore((s) => s.setSelection);
  const editingTextId = useMoodboardStore((s) => s.transient.editingTextId);

  useUndoRedo(true);
  useHtmlPasteHandler(true);
  useHtmlGalleryDropEvent(true, containerRef);
  useKeyboardShortcuts(true);
  const cheatsheetVisible = useShortcutCheatsheet();
  const { triggerUpload, triggerGallery, modals } =
    useHtmlMoodboardImageEntry();

  // Delete / Backspace removes selection; Escape clears it. Matches the
  // Konva page's Moodboard.tsx handler so keyboard parity is 1:1.
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
    <div className="relative h-[calc(100vh-56px)] w-screen overflow-hidden bg-ui-panel">
      <MoodboardHtmlStage containerRef={containerRef} />
      <RecenterIndicator />
      <ShortcutCheatsheet visible={cheatsheetVisible} />
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
