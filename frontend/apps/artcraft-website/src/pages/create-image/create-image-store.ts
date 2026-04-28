import { create } from "zustand";
import type { RecreatePayload } from "../../lib/recreate";
import type { RefImage } from "../../components/prompt-box";

export interface GeneratedImage {
  media_token: string;
  cdn_url: string;
  maybe_thumbnail_template?: string;
}

export type ImageBatch = {
  id: string;
  prompt: string;
  status: "pending" | "complete" | "failed";
  images: GeneratedImage[];
  createdAt: number;
  requestedCount: number;
  modelLabel: string;
  jobToken?: string;
  failureReason?: string;
};

export type ImageUiState = {
  selectedModelId: string | null;
  prompt: string;
  aspectRatio: string;
  numImages: number;
  resolution: string | undefined;
  quality: string | undefined;
};

type CreateImageState = {
  batches: ImageBatch[];
  ui: ImageUiState;
  referenceImages: RefImage[];
  pendingRecreate: RecreatePayload | null;
  setUi: (patch: Partial<ImageUiState>) => void;
  setReferenceImages: (images: RefImage[]) => void;
  setPendingRecreate: (payload: RecreatePayload | null) => void;
  consumePendingRecreate: () => RecreatePayload | null;
  startBatch: (
    prompt: string,
    requestedCount: number,
    modelLabel: string,
  ) => string;
  setBatchJobToken: (batchId: string, jobToken: string) => void;
  completeBatch: (batchId: string, images: GeneratedImage[]) => void;
  failBatch: (batchId: string, reason?: string) => void;
  dismissBatch: (id: string) => void;
  clearCompleted: () => void;
  reset: () => void;
};

const DEFAULT_UI: ImageUiState = {
  selectedModelId: null,
  prompt: "",
  aspectRatio: "square",
  numImages: 1,
  resolution: undefined,
  quality: undefined,
};

export const useCreateImageStore = create<CreateImageState>((set, get) => ({
  batches: [],
  ui: { ...DEFAULT_UI },
  referenceImages: [],
  pendingRecreate: null,

  setUi: (patch) =>
    set((s) => ({ ui: { ...s.ui, ...patch } })),

  setReferenceImages: (images) => set({ referenceImages: images }),

  setPendingRecreate: (payload) => set({ pendingRecreate: payload }),

  consumePendingRecreate: () => {
    const payload = get().pendingRecreate;
    if (payload) set({ pendingRecreate: null });
    return payload;
  },

  startBatch: (prompt, requestedCount, modelLabel) => {
    const id = crypto.randomUUID();
    const batch: ImageBatch = {
      id,
      prompt,
      status: "pending",
      images: [],
      createdAt: Date.now(),
      requestedCount,
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

  completeBatch: (batchId, images) => {
    set((s) => ({
      batches: s.batches.map((b) =>
        b.id === batchId
          ? { ...b, status: "complete" as const, images: images.slice(0, 4) }
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
