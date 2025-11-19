import { create } from "zustand";

export type ImageTo3DResult = {
  id: string;
  mode: "image" | "text";
  timestamp: number;
  note?: string;
  previewUrl?: string;
  meshOnly?: boolean;
  status?: "pending" | "completed";
};

type ImageTo3DState = {
  results: ImageTo3DResult[];
  addResult: (result: ImageTo3DResult) => void;
  updateResultStatus: (id: string, status: "pending" | "completed") => void;
  reset: () => void;
};

export const useImageTo3DStore = create<ImageTo3DState>((set) => ({
  results: [],
  addResult: (result: ImageTo3DResult) => {
    set((s) => ({ results: [result, ...s.results] }));
  },
  updateResultStatus: (id: string, status: "pending" | "completed") => {
    set((s) => ({
      results: s.results.map((r) => (r.id === id ? { ...r, status } : r)),
    }));
  },
  reset: () => set({ results: [] }),
}));

