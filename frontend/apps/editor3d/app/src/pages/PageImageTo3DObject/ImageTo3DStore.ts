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
  completeGeneration: (modelUrl: string, maybeSubscriberId?: string) => void;
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
  completeGeneration: (modelUrl: string, maybeSubscriberId?: string) => {
    console.log("[ImageTo3DStore] completeGeneration", {
      modelUrl,
      maybeSubscriberId,
    });
    const pending = maybeSubscriberId
      ? get().results.find((r) => r.subscriberId === maybeSubscriberId)
      : get().results.find((r) => r.status === "pending");

    set((s) => {
      const results = [...s.results];
      const targetIdx = pending
        ? results.findIndex((r) => r.subscriberId === pending.subscriberId)
        : -1;

      if (targetIdx === -1) {
        const generatedId =
          crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
        const result: ImageTo3DResult = {
          id: generatedId,
          subscriberId: generatedId,
          mode: "image",
          timestamp: Date.now(),
          note: "Generated Model",
          status: "completed",
          modelUrl,
        };
        return { results: [result, ...results] };
      }

      results[targetIdx] = {
        ...results[targetIdx],
        status: "completed",
        modelUrl,
      };

      return { results };
    });
  },
  reset: () => set({ results: [] }),
}));

