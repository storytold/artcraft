import { create } from "zustand";

export interface GeneratedVideo {
  media_token: string;
  cdn_url: string;
  maybe_thumbnail_template?: string;
}

export type VideoBatch = {
  id: string;
  prompt: string;
  status: "pending" | "complete" | "failed";
  video?: GeneratedVideo;
  createdAt: number;
  modelLabel: string;
  jobToken?: string;
  failureReason?: string;
};

type CreateVideoState = {
  batches: VideoBatch[];
  startBatch: (prompt: string, modelLabel: string) => string;
  setBatchJobToken: (batchId: string, jobToken: string) => void;
  completeBatch: (batchId: string, video: GeneratedVideo) => void;
  failBatch: (batchId: string, reason?: string) => void;
  dismissBatch: (id: string) => void;
  reset: () => void;
};

export const useCreateVideoStore = create<CreateVideoState>((set) => ({
  batches: [],

  startBatch: (prompt, modelLabel) => {
    const id = crypto.randomUUID();
    const batch: VideoBatch = {
      id,
      prompt,
      status: "pending",
      createdAt: Date.now(),
      modelLabel,
    };
    set((s) => ({ batches: [...s.batches, batch] }));
    return id;
  },

  setBatchJobToken: (batchId, jobToken) => {
    set((s) => ({
      batches: s.batches.map((b) =>
        b.id === batchId ? { ...b, jobToken } : b,
      ),
    }));
  },

  completeBatch: (batchId, video) => {
    set((s) => ({
      batches: s.batches.map((b) =>
        b.id === batchId
          ? { ...b, status: "complete" as const, video }
          : b,
      ),
    }));
  },

  failBatch: (batchId, reason) => {
    set((s) => ({
      batches: s.batches.map((b) =>
        b.id === batchId
          ? { ...b, status: "failed" as const, failureReason: reason }
          : b,
      ),
    }));
  },

  dismissBatch: (id) => {
    set((s) => ({ batches: s.batches.filter((b) => b.id !== id) }));
  },

  reset: () => set({ batches: [] }),
}));
