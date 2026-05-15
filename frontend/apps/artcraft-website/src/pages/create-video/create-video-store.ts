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
  setUi: (patch: Partial<VideoUiState>) => void;
  setRefs: (patch: Partial<VideoRefsState>) => void;
  setPendingRecreate: (payload: RecreatePayload | null) => void;
  consumePendingRecreate: () => RecreatePayload | null;
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
  generateWithSound: false,
  inputMode: "keyframe",
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
      partialize: (state) => ({
        batches: state.batches.filter((b) => b.status === "pending"),
      }),
    },
  ),
);
