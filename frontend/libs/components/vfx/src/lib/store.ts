import { create } from "zustand";
import {
  DEFAULT_MODEL_ID,
  DEFAULT_RESOLUTION,
  type VFXMediaRef,
  type VFXModelId,
  type VFXResolution,
  type VFXResult,
  type VFXSubTab,
} from "./types";

type VFXState = {
  subTab: VFXSubTab;
  selectedShowcaseId: string | null;
  selectedModelId: VFXModelId;
  source?: VFXMediaRef;
  mask?: VFXMediaRef;
  reference?: VFXMediaRef;
  prompt: string;
  resolution: VFXResolution;
  history: VFXResult[];

  setSubTab: (tab: VFXSubTab) => void;
  setSelectedShowcaseId: (id: string) => void;
  setSelectedModelId: (id: VFXModelId) => void;
  setSource: (ref?: VFXMediaRef) => void;
  setMask: (ref?: VFXMediaRef) => void;
  setReference: (ref?: VFXMediaRef) => void;
  setPrompt: (prompt: string) => void;
  setResolution: (resolution: VFXResolution) => void;
  loadFromShowcase: (showcase: {
    prompt: string;
    resolution: VFXResolution;
    source: VFXMediaRef;
    mask?: VFXMediaRef;
    reference?: VFXMediaRef;
  }) => void;
  startResult: () => string;
  completeResult: (id: string, outputUrl: string) => void;
  failResult: (id: string, reason: string) => void;
  dismissResult: (id: string) => void;
  reset: () => void;
};

export const useVFXStore = create<VFXState>((set, get) => ({
  subTab: "showcase",
  selectedShowcaseId: null,
  selectedModelId: DEFAULT_MODEL_ID,
  prompt: "",
  resolution: DEFAULT_RESOLUTION,
  history: [],

  setSubTab: (tab) => set({ subTab: tab }),
  setSelectedShowcaseId: (id) => set({ selectedShowcaseId: id }),
  setSelectedModelId: (id) => set({ selectedModelId: id }),
  setSource: (ref) => set({ source: ref }),
  setMask: (ref) => set({ mask: ref }),
  setReference: (ref) => set({ reference: ref }),
  setPrompt: (prompt) => set({ prompt }),
  setResolution: (resolution) => set({ resolution }),

  loadFromShowcase: (showcase) => {
    set({
      prompt: showcase.prompt,
      resolution: showcase.resolution,
      source: showcase.source,
      mask: showcase.mask,
      reference: showcase.reference,
    });
  },

  startResult: () => {
    const { prompt, resolution, source, mask, reference } = get();
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    const result: VFXResult = {
      id,
      status: "pending",
      prompt,
      resolution,
      source,
      mask,
      reference,
      createdAt: Date.now(),
    };
    set((s) => ({ history: [result, ...s.history], subTab: "history" }));
    return id;
  },

  completeResult: (id, outputUrl) => {
    set((s) => ({
      history: s.history.map((r) =>
        r.id === id ? { ...r, status: "complete", outputUrl } : r,
      ),
    }));
  },

  failResult: (id, reason) => {
    set((s) => ({
      history: s.history.map((r) =>
        r.id === id ? { ...r, status: "failed", failureReason: reason } : r,
      ),
    }));
  },

  dismissResult: (id) => {
    set((s) => ({ history: s.history.filter((r) => r.id !== id) }));
  },

  reset: () =>
    set({
      source: undefined,
      mask: undefined,
      reference: undefined,
      prompt: "",
      resolution: DEFAULT_RESOLUTION,
      history: [],
      subTab: "showcase",
      selectedShowcaseId: null,
      selectedModelId: DEFAULT_MODEL_ID,
    }),
}));
