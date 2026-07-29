import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoodboardWorkspace,
  dispatchGalleryMoodboardDrop,
} from "@storyteller/ui-moodboard";
import {
  GalleryItem,
  onImageDrop,
  removeImageDropListener,
} from "@storyteller/ui-gallery-modal";
import {
  webappMoodboardAdapter,
  setMoodboardNavigate,
} from "./webappMoodboardAdapter";
import { TopBarActions } from "../../components/topbar/TopBarActions";
import { useSidebar } from "../../components/ui/sidebar";

// Web moodboard page. Renders the full shared workspace (Grid + freeform Konva
// Canvas + Presentation). Fills the SidebarInset content area below the TopBar.
export default function MoodboardPage() {
  const navigate = useNavigate();
  // On desktop the global TopBar is hidden for this route (see app.tsx), so we
  // relocate its nav actions into the board. On mobile the TopBar stays, so we
  // skip the in-page copy to avoid doubling the profile/credits chrome.
  const { isMobile } = useSidebar();

  // Let the (non-hook) generation bridge navigate via the SPA router.
  useEffect(() => {
    setMoodboardNavigate((path) => navigate(path));
  }, [navigate]);

  // Drag a library image onto the grid/canvas to add it to the board.
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

  return (
    <div className="h-full w-full">
      <MoodboardWorkspace
        adapter={webappMoodboardAdapter}
        topBarEndSlot={isMobile ? undefined : <TopBarActions />}
      />
    </div>
  );
}
