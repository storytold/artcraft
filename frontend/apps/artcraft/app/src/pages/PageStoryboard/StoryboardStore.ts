import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

export interface Board {
  id: string;
  imageDataUrl: string | null;
  title: string;
  shotNumber: number;
  dialogue: string;
  action: string;
  notes: string;
  duration: number;
}

interface StoryboardState {
  boards: Board[];
  selectedBoardId: string | null;

  addBoard: () => void;
  deleteBoard: (id: string) => void;
  selectBoard: (id: string) => void;
  updateBoard: (id: string, patch: Partial<Omit<Board, "id" | "shotNumber">>) => void;
  reorderBoards: (fromIndex: number, toIndex: number) => void;
  reset: () => void;
}

const syncShotNumbers = (boards: Board[]): Board[] =>
  boards.map((b, i) => ({ ...b, shotNumber: i + 1 }));

export const useStoryboardStore = create<StoryboardState>((set, get) => ({
  boards: [],
  selectedBoardId: null,

  addBoard: () => {
    const newBoard: Board = {
      id: uuidv4(),
      imageDataUrl: null,
      title: "",
      shotNumber: get().boards.length + 1,
      dialogue: "",
      action: "",
      notes: "",
      duration: 3,
    };
    set((state) => ({
      boards: [...state.boards, newBoard],
      selectedBoardId: newBoard.id,
    }));
  },

  deleteBoard: (id) => {
    set((state) => {
      const idx = state.boards.findIndex((b) => b.id === id);
      const remaining = syncShotNumbers(state.boards.filter((b) => b.id !== id));
      const nextSelected = remaining[idx] ?? remaining[idx - 1] ?? null;
      return {
        boards: remaining,
        selectedBoardId: nextSelected?.id ?? null,
      };
    });
  },

  selectBoard: (id) => {
    set({ selectedBoardId: id });
  },

  updateBoard: (id, patch) => {
    set((state) => ({
      boards: state.boards.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  },

  reorderBoards: (fromIndex, toIndex) => {
    set((state) => {
      const arr = [...state.boards];
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
      return { boards: syncShotNumbers(arr) };
    });
  },

  reset: () => {
    set({ boards: [], selectedBoardId: null });
  },
}));
