// ImageTo3DStore (components copy): a small zustand store that keeps the list of image-to-3D results.
// At the time of writing nothing imports this copy: ImageTo3DExperience.tsx and TopBar.tsx use the
// live store in pages/PageImageTo3DObject/ImageTo3DStore.ts instead.

import { create } from "zustand";

// How a 3D result was started: from an uploaded image or from a text prompt.
export type ImageTo3DMode = "image" | "text";

/**
 * One entry in the results list.
 * timestamp is Date.now() at creation; previewUrl is the thumbnail/model preview once known;
 * meshOnly marks a result with geometry but no texture; status is pending until the job finishes.
 */
export interface ImageTo3DResult {
  id: string;
  mode: ImageTo3DMode;
  timestamp: number;
  note?: string;
  previewUrl?: string;
  meshOnly?: boolean;
  status?: "pending" | "completed";
}

// Shape of the store: the data (results, newest first) plus the actions that change it.
interface ImageTo3DState {
  results: ImageTo3DResult[];
  addResult: (result: ImageTo3DResult) => void;
  updateResult: (id: string, updates: Partial<ImageTo3DResult>) => void;
  reset: () => void;
}

/**
 * React hook to read/update the results list (zustand).
 * addResult puts the new result at the front, updateResult merges changes into the result with that id,
 * reset empties the list.
 */
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

