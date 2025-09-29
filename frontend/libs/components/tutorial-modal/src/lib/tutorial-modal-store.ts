import { create } from "zustand";
import type { TutorialItem } from "./tutorials";

type TutorialView = "grid" | "video";

type TutorialModalStore = {
  view: TutorialView;
  selected: TutorialItem | null;
  progressSecondsById: Record<string, number>;
  setGrid: () => void;
  viewTutorial: (item: TutorialItem) => void;
  getProgress: (id: string) => number;
  setProgress: (id: string, seconds: number) => void;
};

export const useTutorialModalStore = create<TutorialModalStore>((set, get) => ({
  view: "grid",
  selected: null,
  progressSecondsById: {},
  setGrid: () => set({ view: "grid", selected: null }),
  viewTutorial: (item) => set({ view: "video", selected: item }),
  getProgress: (id) => get().progressSecondsById[id] ?? 0,
  setProgress: (id, seconds) =>
    set((state) => ({
      progressSecondsById: { ...state.progressSecondsById, [id]: seconds },
    })),
}));
