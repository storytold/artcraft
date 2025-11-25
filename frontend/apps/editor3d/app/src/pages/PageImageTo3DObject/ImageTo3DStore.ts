import { create } from "zustand";

export type ImageTo3DResult = {
  id: string;
  mode: "image" | "text";
  timestamp: number;
  note?: string;
  previewUrl?: string;
  meshOnly?: boolean;
  status: "pending" | "completed";
  subscriberId: string;
  modelUrl?: string;
};

type ImageTo3DState = {
  results: ImageTo3DResult[];
  startGeneration: (
    mode: "image" | "text",
    note: string,
    previewUrl: string | undefined,
    meshOnly: boolean,
    subscriberId?: string
  ) => string;
  completeGeneration: (
    subscriberId: string,
    modelUrl: string
  ) => void;
  reset: () => void;
};

export const useImageTo3DStore = create<ImageTo3DState>((set, get) => ({
  results: [],
  startGeneration: (
    mode: "image" | "text",
    note: string,
    previewUrl: string | undefined,
    meshOnly: boolean,
    subscriberId?: string
  ) => {
    const id = subscriberId
      ? subscriberId
      : crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    const result: ImageTo3DResult = {
      id,
      mode,
      timestamp: Date.now(),
      note,
      previewUrl,
      meshOnly,
      status: "pending",
      subscriberId: id,
    };
    set((s) => ({ results: [result, ...s.results] }));
    return id;
  },
  completeGeneration: (subscriberId: string, modelUrl: string) => {
    const pending = get().results.find((r) => r.subscriberId === subscriberId);
    if (!pending) return;
    
    set((s) => ({
      results: s.results.map((r) =>
        r.subscriberId === subscriberId
          ? { ...r, status: "completed" as const, modelUrl }
          : r
      ),
    }));
  },
  reset: () => set({ results: [] }),
}));

