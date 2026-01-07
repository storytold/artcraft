import { create } from "zustand";
import type { GeneratedImage } from "@storyteller/tauri-events";

export type TextToImageBatch = {
  id: string;
  prompt: string;
  status: "pending" | "complete";
  images: GeneratedImage[];
  createdAt: number;
  requestedCount: number;
  modelLabel: string;
  subscriberId: string;
};

type TextToImageState = {
  batches: TextToImageBatch[];
  startBatch: (
    prompt: string,
    requestedCount: number,
    modelLabel: string,
    subscriberId?: string,
  ) => string;
  completeBatch: (
    images: GeneratedImage[],
    maybeSubscriberId?: string,
    maybePrompt?: string,
  ) => void;
  reset: () => void;
};

export const useTextToImageStore = create<TextToImageState>((set, get) => ({
  batches: [],
  startBatch: (
    prompt: string,
    requestedCount: number,
    modelLabel: string,
    subscriberId?: string,
  ) => {
    const id = subscriberId
      ? subscriberId
      : crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    const batch: TextToImageBatch = {
      id,
      prompt,
      status: "pending",
      images: [],
      createdAt: Date.now(),
      requestedCount,
      modelLabel,
      subscriberId: id,
    };
    set((s) => ({ batches: [...s.batches, batch] }));
    return id;
  },
  completeBatch: (
    images: GeneratedImage[],
    maybeSubscriberId?: string,
    maybePrompt?: string,
  ) => {
    const pending = maybeSubscriberId
      ? get().batches.find((b) => b.subscriberId === maybeSubscriberId)
      : get().batches.find((b) => b.status === "pending");
    const prompt = pending?.prompt ?? maybePrompt ?? "";
    const modelLabel = pending?.modelLabel ?? "";
    // Mark the most recent pending batch complete, or create one if none exists
    set((s) => {
      const idx = pending
        ? s.batches.findIndex((b) => b.id === pending.id)
        : -1;
      if (idx === -1) {
        return { batches: s.batches };
      }
      const updated = [...s.batches];
      updated[idx] = {
        ...updated[idx],
        status: "complete",
        images: images.slice(0, 4),
      };
      return { batches: updated };
    });
  },
  reset: () => set({ batches: [] }),
}));
