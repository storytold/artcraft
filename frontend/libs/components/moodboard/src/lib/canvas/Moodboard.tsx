import { useRef } from "react";
import Konva from "konva";
import { MoodboardToolbar } from "./MoodboardToolbar";
import { MoodboardStage } from "./MoodboardStage";
import { TextEditOverlay } from "./TextEditOverlay";
import { usePasteHandler } from "./interactions/usePasteHandler";
import { useGalleryDropEvent } from "./interactions/useGalleryDropEvent";
import { useMoodboardKeybinds } from "./interactions/useMoodboardKeybinds";
import { useMoodboardImageEntry } from "./useMoodboardImageEntry";
import { RecenterIndicator } from "./overlays/RecenterIndicator";
import type { MoodboardAdapter } from "../adapter";
// import { EmptyMoodboardCTA } from "./EmptyMoodboardCTA";

interface Props {
  adapter: MoodboardAdapter;
}

export const Moodboard = ({ adapter }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  // const isEmpty = useMoodboardStore((s) => s.rootOrder.length === 0);

  usePasteHandler(adapter, true, stageRef);
  useGalleryDropEvent(true, stageRef);
  // All discrete moodboard shortcuts (tools, selection, group/ungroup, delete,
  // fit, undo/redo) now resolve from the unified keybinds store.
  useMoodboardKeybinds(true);
  const { triggerUpload, triggerGallery, modals } = useMoodboardImageEntry(
    adapter,
    stageRef,
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-ui-panel"
    >
      <MoodboardStage containerRef={containerRef} stageRef={stageRef} />
      <TextEditOverlay containerRef={containerRef} />
      <RecenterIndicator />
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
