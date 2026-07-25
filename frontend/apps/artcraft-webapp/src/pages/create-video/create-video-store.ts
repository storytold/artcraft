import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RecreatePayload } from "../../lib/recreate";
import type {
  RefImage,
  RefVideo,
  RefAudio,
} from "../../components/prompt-box";

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
  batchCount?: number;
};

export type VideoInputMode = "keyframe" | "reference";

export type VideoUiState = {
  selectedModelId: string | null;
  prompt: string;
  selectedSize: string;
  duration: number | null;
  resolution: string | null;
  bitrate: string | null;
  generateWithSound: boolean;
  inputMode: VideoInputMode;
  numVideos: number;
};

export type VideoRefsState = {
  referenceImages: RefImage[];
  endFrameImage: RefImage | undefined;
  referenceVideos: RefVideo[];
  referenceAudios: RefAudio[];
};

type CreateVideoState = {
  batches: VideoBatch[];
  ui: VideoUiState;
  refs: VideoRefsState;
  pendingRecreate: RecreatePayload | null;
  // Reference media sent from another page (library "Send to prompt").
  // Consumed by the create-video page, which applies the real per-model caps.
  pendingRefImages: RefImage[] | null;
  pendingRefVideos: RefVideo[] | null;
  setUi: (patch: Partial<VideoUiState>) => void;
  setRefs: (patch: Partial<VideoRefsState>) => void;
  setPendingRecreate: (payload: RecreatePayload | null) => void;
  consumePendingRecreate: () => RecreatePayload | null;
  setPendingRefImages: (refs: RefImage[] | null) => void;
  consumePendingRefImages: () => RefImage[] | null;
  setPendingRefVideos: (refs: RefVideo[] | null) => void;
  consumePendingRefVideos: () => RefVideo[] | null;
  startBatch: (prompt: string, modelLabel: string, batchCount?: number) => string;
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
  bitrate: null,
  generateWithSound: false,
  inputMode: "reference",
  numVideos: 1,
};

const DEFAULT_REFS: VideoRefsState = {
  referenceImages: [],
  endFrameImage: undefined,
  referenceVideos: [],
  referenceAudios: [],
};

export const useCreateVideoStore = create<CreateVideoState>()(
  persist(
    (set, get) => ({
      batches: [],
      ui: { ...DEFAULT_UI },
      refs: { ...DEFAULT_REFS },
      pendingRecreate: null,
      pendingRefImages: null,
      pendingRefVideos: null,

      setUi: (patch) =>
        set((s) => ({ ui: { ...s.ui, ...patch } })),

      setRefs: (patch) =>
        set((s) => ({ refs: { ...s.refs, ...patch } })),

      setPendingRecreate: (payload) => set({ pendingRecreate: payload }),

      consumePendingRecreate: () => {
        const payload = get().pendingRecreate;
        if (payload) set({ pendingRecreate: null });
        return payload;
      },

      setPendingRefImages: (refs) => set({ pendingRefImages: refs }),

      consumePendingRefImages: () => {
        const refs = get().pendingRefImages;
        if (refs) set({ pendingRefImages: null });
        return refs;
      },

      setPendingRefVideos: (refs) => set({ pendingRefVideos: refs }),

      consumePendingRefVideos: () => {
        const refs = get().pendingRefVideos;
        if (refs) set({ pendingRefVideos: null });
        return refs;
      },

      startBatch: (prompt, modelLabel, batchCount) => {
        const id = crypto.randomUUID();
        const batch: VideoBatch = {
          id,
          prompt,
          status: "pending",
          createdAt: Date.now(),
          modelLabel,
          batchCount,
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
    }),
    {
      name: "artcraft-video-batches",
      // Bumped to 1 when reference became the default input mode: the
      // migration runs once for pre-existing persisted state and resets the
      // stored mode so everyone lands on the new default.
      version: 1,
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as {
          batches?: VideoBatch[];
          ui?: VideoUiState;
        };
        const ui = { ...DEFAULT_UI, ...(p.ui ?? {}) };
        if (version < 1) {
          ui.inputMode = "reference";
        }
        return { batches: p.batches ?? [], ui };
      },
      // Persist prompt + lightweight settings alongside pending batches so a
      // full page reload (e.g. returning from a credit top-up) keeps the
      // user's draft. Reference media (refs) is excluded for the same reason
      // as the image store: File handles + blob URLs don't survive serialization.
      partialize: (state) => ({
        batches: state.batches.filter((b) => b.status === "pending"),
        ui: state.ui,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CreateVideoState>;
        return {
          ...current,
          ...p, // restores persisted pending batches
          ui: { ...current.ui, ...((p.ui as Partial<VideoUiState>) ?? {}) },
        };
      },
    },
  ),
);
