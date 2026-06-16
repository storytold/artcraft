import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MoodboardWorkspace } from "@storyteller/ui-moodboard";
import {
  webappMoodboardAdapter,
  setMoodboardNavigate,
} from "./webappMoodboardAdapter";

// Web moodboard page. Renders the full shared workspace (Grid + freeform Konva
// Canvas + Presentation). Fills the SidebarInset content area below the TopBar.
export default function MoodboardPage() {
  const navigate = useNavigate();

  // Let the (non-hook) generation bridge navigate via the SPA router.
  useEffect(() => {
    setMoodboardNavigate((path) => navigate(path));
  }, [navigate]);

  return (
    <div className="h-full w-full">
      <MoodboardWorkspace adapter={webappMoodboardAdapter} />
    </div>
  );
}
