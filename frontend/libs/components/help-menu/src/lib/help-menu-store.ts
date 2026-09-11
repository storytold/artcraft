import { create } from "zustand";
import { TutorialItem } from "./tutorials";

export type ViewType = "grid" | "video" | "news";

interface TutorialModalState {
  isOpen: boolean;
  view: ViewType;
  selected: TutorialItem | null;
  progress: Record<string, number>; // itemId -> seconds
  setOpen: (isOpen: boolean) => void;
  setGrid: () => void;
  setNews: () => void;
  viewTutorial: (item: TutorialItem) => void;
  setProgress: (id: string, seconds: number) => void;
  getProgress: (id: string) => number;
}

export const useTutorialModalStore = create<TutorialModalState>()(
  (set, get) => ({
    isOpen: false,
    view: "grid",
    selected: null,
    progress: {},

    setOpen: (isOpen) => set({ isOpen }),
    setGrid: () => set({ view: "grid", selected: null }),
    setNews: () => set({ view: "news", selected: null }),
    viewTutorial: (item) => set({ view: "video", selected: item }),

    setProgress: (id, seconds) =>
      set((state) => ({
        progress: { ...state.progress, [id]: seconds },
      })),

    getProgress: (id) => get().progress[id] || 0,
  })
);
