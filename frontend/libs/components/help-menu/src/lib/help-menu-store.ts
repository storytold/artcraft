// zustand is a tiny state library: `create` builds a store whose values any component can read and whose actions any code can call.
import { create } from "zustand";
// The shape of one tutorial entry (id, title, thumbnail, video address, category).
import { TutorialItem } from "./tutorials";

// Which screen the Help window shows: the tutorial thumbnails, one tutorial video, or the news list.
export type ViewType = "grid" | "video" | "news";

// Everything the store holds and every action it offers.
interface TutorialModalState {
  // Whether the Help window is open according to this store. (HelpMenuButton keeps its own `open` flag and does not read this one.)
  isOpen: boolean;
  // The screen currently showing.
  view: ViewType;
  // The tutorial being watched on the "video" screen, or null on the other screens.
  selected: TutorialItem | null;
  // How many seconds of each tutorial have been watched, keyed by the tutorial's id. Kept in memory only, so it resets when the app restarts.
  progress: Record<string, number>; // itemId -> seconds
  // Set the `isOpen` flag.
  setOpen: (isOpen: boolean) => void;
  // Go to the thumbnail grid (and forget the picked tutorial).
  setGrid: () => void;
  // Go to the news list (and forget the picked tutorial).
  setNews: () => void;
  // Go to the video screen for this tutorial.
  viewTutorial: (item: TutorialItem) => void;
  // Remember that `seconds` of tutorial `id` have been watched.
  setProgress: (id: string, seconds: number) => void;
  // Read the remembered seconds for a tutorial (0 when never watched).
  getProgress: (id: string) => number;
}

// The store itself. `set` replaces the named values; `get` reads the current values.
export const useTutorialModalStore = create<TutorialModalState>()(
  (set, get) => ({
    // Starting values: window closed, on the grid, nothing picked, nothing watched.
    isOpen: false,
    view: "grid",
    selected: null,
    progress: {},

    // Store the open flag.
    setOpen: (isOpen) => set({ isOpen }),
    // Show the grid and clear the pick, which also makes the YouTube player in HelpMenuButton shut down.
    setGrid: () => set({ view: "grid", selected: null }),
    // Show the news list and clear the pick.
    setNews: () => set({ view: "news", selected: null }),
    // Show the video screen for this tutorial.
    viewTutorial: (item) => set({ view: "video", selected: item }),

    // Save the watch position. A copy of the old record with the one entry replaced keeps the other tutorials' positions.
    setProgress: (id, seconds) =>
      set((state) => ({
        progress: { ...state.progress, [id]: seconds },
      })),

    // Look up the saved position; a missing entry (undefined) or 0 both give 0.
    getProgress: (id) => get().progress[id] || 0,
  })
);
