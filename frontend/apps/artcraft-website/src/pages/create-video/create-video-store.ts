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

export type VideoInputMode = "keyframe" | "reference";

export type VideoUiState = {
  selectedModelId: string | null;
  prompt: string;
  selectedSize: string;
  duration: number | null;
  resolution: string | null;
  generateWithSound: boolean;
  inputMode: VideoInputMode;
};

type CreateVideoState = {
  batches: VideoBatch[];
  ui: VideoUiState;
  setUi: (patch: Partial<VideoUiState>) => void;
  startBatch: (prompt: string, modelLabel: string) => string;
  setBatchJobToken: (batchId: string, jobToken: string) => void;
  completeBatch: (batchId: string, video: GeneratedVideo) => void;
  failBatch: (batchId: string, reason?: string) => void;
  dismissBatch: (id: string) => void;
  clearCompleted: () => void;
  reset: () => void;
};

const DEFAULT_UI: VideoUiState = {
  selectedModelId: null,
  prompt: "",
  selectedSize: "wide_sixteen_by_nine",
  duration: null,
  resolution: null,
  generateWithSound: false,
  inputMode: "keyframe",
};

export const useCreateVideoStore = create<CreateVideoState>((set) => ({
  batches: [],
  ui: { ...DEFAULT_UI },

  setUi: (patch) =>
    set((s) => ({ ui: { ...s.ui, ...patch } })),

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

  clearCompleted: () => {
    set((s) => ({
      batches: s.batches.filter((b) => b.status !== "complete"),
    }));
  },

  reset: () => set({ batches: [] }),
}));
