import { MoodboardWorkspace } from "@storyteller/ui-moodboard";
import { desktopMoodboardAdapter } from "./desktopMoodboardAdapter";

// Desktop moodboard tab. The shared workspace fills its parent; MainApp's
// TabBody wraps this in a sized container.
export const PageMoodboard = () => (
  <MoodboardWorkspace adapter={desktopMoodboardAdapter} />
);
