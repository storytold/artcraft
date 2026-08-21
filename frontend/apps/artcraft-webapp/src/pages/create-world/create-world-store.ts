import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RecreatePayload } from "../../lib/recreate";
import type { RefImage, RefVideo } from "../../components/prompt-box";

// A generated splat (3D world). `cdn_url` here is the .spz file.
export interface GeneratedAsset {
  media_token: string;
  cdn_url: string;
  maybe_thumbnail_template?: string;
}

export type SplatBatch = {
  id: string;
  prompt: string;
  status: "pending" | "complete" | "failed";
  assets: GeneratedAsset[];
  createdAt: number;
  modelLabel: string;
  jobToken?: string;
  failureReason?: string;
};

export type SplatUiState = {
  selectedModelId: string | null;
  prompt: string;
  isPanoramic: boolean | undefined;
  disableRecaption: boolean | undefined;
};

type CreateWorldState = {
  batches: SplatBatch[];
  ui: SplatUiState;
  referenceImages: RefImage[];
  // At most one guide video. Not persisted (File handles / blob URLs aren't
  // serializable).
  referenceVideos: RefVideo[];
  pendingRecreate: RecreatePayload | null;
  setUi: (patch: Partial<SplatUiState>) => void;
  setReferenceImages: (images: RefImage[]) => void;
  setReferenceVideos: (videos: RefVideo[]) => void;
  setPendingRecreate: (payload: RecreatePayload | null) => void;
  consumePendingRecreate: () => RecreatePayload | null;
  startBatch: (prompt: string, modelLabel: string) => string;
  setBatchJobToken: (batchId: string, jobToken: string) => void;
  completeBatch: (batchId: string, assets: GeneratedAsset[]) => void;
  failBatch: (batchId: string, reason?: string) => void;
  dismissBatch: (id: string) => void;
  reset: () => void;
};

const DEFAULT_UI: SplatUiState = {
  selectedModelId: null,
  prompt: "",
  isPanoramic: undefined,
  disableRecaption: undefined,
};

export const useCreateWorldStore = create<CreateWorldState>()(
  persist(
    (set, get) => ({
      batches: [],
      ui: { ...DEFAULT_UI },
      referenceImages: [],
      referenceVideos: [],
      pendingRecreate: null,

      setUi: (patch) => set((s) => ({ ui: { ...s.ui, ...patch } })),

      setReferenceImages: (images) => set({ referenceImages: images }),

      setReferenceVideos: (videos) => set({ referenceVideos: videos }),

      setPendingRecreate: (payload) => set({ pendingRecreate: payload }),

      consumePendingRecreate: () => {
        const payload = get().pendingRecreate;
        if (payload) set({ pendingRecreate: null });
        return payload;
      },

      startBatch: (prompt, modelLabel) => {
        const id = crypto.randomUUID();
        const batch: SplatBatch = {
          id,
          prompt,
          status: "pending",
          assets: [],
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

      completeBatch: (batchId, assets) => {
        set((s) => ({
          batches: s.batches.map((b) =>
            b.id === batchId
              ? { ...b, status: "complete" as const, assets }
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
    }),
    {
      name: "artcraft-world-prompt",
      partialize: (state) => ({ ui: state.ui }),
      merge: (persisted, current) => {
        const persistedUi = (persisted as { ui?: Partial<SplatUiState> } | null)
          ?.ui;
        return { ...current, ui: { ...current.ui, ...(persistedUi ?? {}) } };
      },
    },
  ),
);
