import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RecreatePayload } from "../../lib/recreate";
import type { RefImage } from "../../components/prompt-box";

// A generated 3D asset (mesh). Shape mirrors the image store's GeneratedImage so
// the shared polling helpers can be reused; `cdn_url` here is the .glb file.
export interface GeneratedAsset {
  media_token: string;
  cdn_url: string;
  maybe_thumbnail_template?: string;
}

export type MeshBatch = {
  id: string;
  prompt: string;
  status: "pending" | "complete" | "failed";
  assets: GeneratedAsset[];
  createdAt: number;
  modelLabel: string;
  jobToken?: string;
  failureReason?: string;
};

export type MeshUiState = {
  selectedModelId: string | null;
  prompt: string;
  meshOutputType: string | undefined;
  polygonType: string | undefined;
  faceCount: number | undefined;
  enablePbr: boolean | undefined;
  enableTexture: boolean | undefined;
  textureQuality: string | undefined;
  geometryQuality: string | undefined;
};

// Multi-view side inputs + a mesh-to-mesh input file. Not persisted (File
// handles + data URLs aren't serializable / can exceed the storage quota).
export type MeshInputsState = {
  frontImage: RefImage | undefined;
  backImage: RefImage | undefined;
  leftImage: RefImage | undefined;
  rightImage: RefImage | undefined;
  inputMesh: RefImage | undefined;
};

type CreateObjectState = {
  batches: MeshBatch[];
  ui: MeshUiState;
  referenceImages: RefImage[];
  inputs: MeshInputsState;
  pendingRecreate: RecreatePayload | null;
  setUi: (patch: Partial<MeshUiState>) => void;
  setReferenceImages: (images: RefImage[]) => void;
  setInputs: (patch: Partial<MeshInputsState>) => void;
  setPendingRecreate: (payload: RecreatePayload | null) => void;
  consumePendingRecreate: () => RecreatePayload | null;
  startBatch: (prompt: string, modelLabel: string) => string;
  setBatchJobToken: (batchId: string, jobToken: string) => void;
  completeBatch: (batchId: string, assets: GeneratedAsset[]) => void;
  failBatch: (batchId: string, reason?: string) => void;
  dismissBatch: (id: string) => void;
  reset: () => void;
};

const DEFAULT_UI: MeshUiState = {
  selectedModelId: null,
  prompt: "",
  meshOutputType: undefined,
  polygonType: undefined,
  faceCount: undefined,
  enablePbr: undefined,
  enableTexture: undefined,
  textureQuality: undefined,
  geometryQuality: undefined,
};

const DEFAULT_INPUTS: MeshInputsState = {
  frontImage: undefined,
  backImage: undefined,
  leftImage: undefined,
  rightImage: undefined,
  inputMesh: undefined,
};

export const useCreateObjectStore = create<CreateObjectState>()(
  persist(
    (set, get) => ({
      batches: [],
      ui: { ...DEFAULT_UI },
      referenceImages: [],
      inputs: { ...DEFAULT_INPUTS },
      pendingRecreate: null,

      setUi: (patch) => set((s) => ({ ui: { ...s.ui, ...patch } })),

      setReferenceImages: (images) => set({ referenceImages: images }),

      setInputs: (patch) => set((s) => ({ inputs: { ...s.inputs, ...patch } })),

      setPendingRecreate: (payload) => set({ pendingRecreate: payload }),

      consumePendingRecreate: () => {
        const payload = get().pendingRecreate;
        if (payload) set({ pendingRecreate: null });
        return payload;
      },

      startBatch: (prompt, modelLabel) => {
        const id = crypto.randomUUID();
        const batch: MeshBatch = {
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
      name: "artcraft-object-prompt",
      // Persist only the lightweight settings; reference images / input files
      // are excluded (not serializable, can exceed the localStorage quota).
      partialize: (state) => ({ ui: state.ui }),
      merge: (persisted, current) => {
        const persistedUi = (persisted as { ui?: Partial<MeshUiState> } | null)
          ?.ui;
        return { ...current, ui: { ...current.ui, ...(persistedUi ?? {}) } };
      },
    },
  ),
);
