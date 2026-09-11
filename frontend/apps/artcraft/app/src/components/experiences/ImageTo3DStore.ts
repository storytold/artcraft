import { create } from "zustand";

export type ImageTo3DMode = "image" | "text";

export interface ImageTo3DResult {
  id: string;
  mode: ImageTo3DMode;
  timestamp: number;
  note?: string;
  previewUrl?: string;
  meshOnly?: boolean;
  status?: "pending" | "completed";
}

interface ImageTo3DState {
  results: ImageTo3DResult[];
  addResult: (result: ImageTo3DResult) => void;
  updateResult: (id: string, updates: Partial<ImageTo3DResult>) => void;
  reset: () => void;
}

export const useImageTo3DStore = create<ImageTo3DState>((set) => ({
  results: [],
  addResult: (result) =>
    set((state) => ({ results: [result, ...state.results] })),
  updateResult: (id, updates) =>
    set((state) => ({
      results: state.results.map((r) =>
        r.id === id ? { ...r, ...updates } : r,
      ),
    })),
  reset: () => set({ results: [] }),
}));

