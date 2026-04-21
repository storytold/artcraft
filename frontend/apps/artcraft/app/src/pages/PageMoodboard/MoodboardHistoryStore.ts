import { create } from "zustand";
import { MoodboardSnapshot } from "./types";

const MAX_HISTORY = 50;

interface MoodboardHistoryState {
  past: MoodboardSnapshot[];
  future: MoodboardSnapshot[];
  push: (snapshot: MoodboardSnapshot) => void;
  undo: (current: MoodboardSnapshot) => MoodboardSnapshot | null;
  redo: (current: MoodboardSnapshot) => MoodboardSnapshot | null;
  clear: () => void;
}

export const useMoodboardHistoryStore = create<MoodboardHistoryState>(
  (set, get) => ({
    past: [],
    future: [],
    push: (snapshot) => {
      const past = get().past;
      const next = [...past, snapshot];
      if (next.length > MAX_HISTORY) next.shift();
      set({ past: next, future: [] });
    },
    undo: (current) => {
      const { past, future } = get();
      if (past.length === 0) return null;
      const prior = past[past.length - 1];
      set({
        past: past.slice(0, -1),
        future: [...future, current],
      });
      return prior;
    },
    redo: (current) => {
      const { past, future } = get();
      if (future.length === 0) return null;
      const next = future[future.length - 1];
      set({
        past: [...past, current],
        future: future.slice(0, -1),
      });
      return next;
    },
    clear: () => set({ past: [], future: [] }),
  }),
);
