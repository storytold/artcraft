import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

export type VideoItem = {
  media_token: string;
  cdn_url: string;
};

export type ImageToVideoBatch = {
  id: string;
  prompt: string;
  status: "pending" | "complete";
  video?: VideoItem;
  createdAt: number;
  modelLabel: string;
  subscriberId: string;
};

type ImageToVideoState = {
  batches: ImageToVideoBatch[];
  startBatch: (
    prompt: string,
    modelLabel: string,
    subscriberId?: string,
  ) => string;
  completeBatch: (
    video: VideoItem | undefined,
    maybeSubscriberId?: string,
    maybePrompt?: string,
  ) => void;
  reset: () => void;
};

export const useImageToVideoStore = create<ImageToVideoState>((set, get) => ({
  batches: [],
  startBatch: (prompt: string, modelLabel: string, subscriberId?: string) => {
    const id = subscriberId || uuidv4();
    const batch: ImageToVideoBatch = {
      id,
      prompt,
      status: "pending",
      video: undefined,
      createdAt: Date.now(),
      modelLabel,
      subscriberId: id,
    };
    set((s) => ({ batches: [...s.batches, batch] }));
    return id;
  },
  completeBatch: (video, maybeSubscriberId, maybePrompt) => {
    const pending = maybeSubscriberId
      ? get().batches.find((b) => b.subscriberId === maybeSubscriberId)
      : get().batches.find((b) => b.status === "pending");
    const prompt = pending?.prompt ?? maybePrompt ?? "";
    const modelLabel = pending?.modelLabel ?? "";
    set((s) => {
      const idx = pending
        ? s.batches.findIndex((b) => b.id === pending.id)
        : -1;
      if (idx === -1) {
        const id = uuidv4();
        const batch: ImageToVideoBatch = {
          id,
          prompt,
          status: "complete",
          video,
          createdAt: Date.now(),
          modelLabel,
          subscriberId: id,
        };
        return { batches: [...s.batches, batch] };
      }
      const updated = [...s.batches];
      updated[idx] = { ...updated[idx], status: "complete", video };
      return { batches: updated };
    });
  },
  reset: () => set({ batches: [] }),
}));
