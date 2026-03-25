import { create } from "zustand";
import type { GeneratedImage } from "@storyteller/tauri-events";
import type { ModelCreator } from "@storyteller/model-list";

export type TextToImageBatch = {
  id: string;
  prompt: string;
  status: "pending" | "complete" | "failed";
  images: GeneratedImage[];
  createdAt: number;
  requestedCount: number;
  modelLabel: string;
  modelCreator?: ModelCreator;
  subscriberId: string;
  failureReason?: string;
};

type TextToImageState = {
  batches: TextToImageBatch[];
  startBatch: (
    prompt: string,
    requestedCount: number,
    modelLabel: string,
    subscriberId?: string,
    modelCreator?: ModelCreator,
  ) => string;
  completeBatch: (
    images: GeneratedImage[],
    maybeSubscriberId?: string,
    maybePrompt?: string,
  ) => void;
  failBatch: (reason?: string) => void;
  dismissBatch: (id: string) => void;
  reset: () => void;
};

export const useTextToImageStore = create<TextToImageState>((set, get) => ({
  batches: [],
  startBatch: (
    prompt: string,
    requestedCount: number,
    modelLabel: string,
    subscriberId?: string,
    modelCreator?: ModelCreator,
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
      modelCreator,
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
    //const prompt = pending?.prompt ?? maybePrompt ?? "";
    //const modelLabel = pending?.modelLabel ?? "";
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
  failBatch: (reason?: string) => {
    set((s) => {
      // Mark the oldest pending batch as failed
      const idx = s.batches.findIndex((b) => b.status === "pending");
      if (idx === -1) return { batches: s.batches };
      const updated = [...s.batches];
      updated[idx] = {
        ...updated[idx],
        status: "failed",
        failureReason: reason,
      };
      return { batches: updated };
    });
  },
  dismissBatch: (id: string) => {
    set((s) => ({
      batches: s.batches.filter((b) => b.id !== id),
    }));
  },
  reset: () => set({ batches: [] }),
}));
