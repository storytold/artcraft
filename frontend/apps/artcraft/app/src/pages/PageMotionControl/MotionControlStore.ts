import { create } from "zustand";

export type MotionControlVideo = {
  media_token: string;
  cdn_url: string;
};

export type MotionControlBatch = {
  id: string;
  prompt: string;
  status: "pending" | "complete";
  video?: MotionControlVideo;
  createdAt: number;
  modelLabel: string;
  subscriberId: string;
};

type MotionControlState = {
  batches: MotionControlBatch[];
  startBatch: (
    prompt: string,
    modelLabel: string,
    subscriberId?: string,
  ) => string;
  completeBatch: (
    video: MotionControlVideo | undefined,
    maybeSubscriberId?: string,
    maybePrompt?: string,
  ) => void;
  reset: () => void;
};

export const useMotionControlStore = create<MotionControlState>((set, get) => ({
  batches: [],
  startBatch: (prompt, modelLabel, subscriberId) => {
    const id = subscriberId
      ? subscriberId
      : crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    const batch: MotionControlBatch = {
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
        const id = Math.random().toString(36).slice(2);
        const batch: MotionControlBatch = {
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
