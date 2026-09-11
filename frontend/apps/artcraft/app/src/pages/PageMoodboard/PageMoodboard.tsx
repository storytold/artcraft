import { useEffect } from "react";
import {
  MoodboardWorkspace,
  dispatchGalleryMoodboardDrop,
} from "@storyteller/ui-moodboard";
import {
  GalleryItem,
  onImageDrop,
  removeImageDropListener,
} from "@storyteller/ui-gallery-modal";
import { desktopMoodboardAdapter } from "./desktopMoodboardAdapter";

// Desktop moodboard tab. The shared workspace fills its parent; MainApp's
// TabBody wraps this in a sized container.
export const PageMoodboard = () => {
  useGalleryDropBridge();
  return <MoodboardWorkspace adapter={desktopMoodboardAdapter} />;
};

// Bridges gallery-modal's onImageDrop into the moodboard's board-drop event, so
// dragging a library image onto the grid/canvas adds it. Mounted only while the
// moodboard tab is active, so it doesn't race the 2D/3D tab drop handlers.
const useGalleryDropBridge = () => {
  useEffect(() => {
    const handler = onImageDrop(
      (item: GalleryItem, position: { x: number; y: number }) => {
        dispatchGalleryMoodboardDrop(item, position);
      },
    );
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (handler) removeImageDropListener(handler as any);
    };
  }, []);
};
