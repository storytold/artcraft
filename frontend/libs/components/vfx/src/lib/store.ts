import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  attachJobToken: (id: string, token: string) => void;
  completeResult: (id: string, outputUrl: string) => void;
  failResult: (id: string, reason: string) => void;
  dismissResult: (id: string) => void;
  /**
   * Seed a history item that came from the server (session sync). If a
   * matching `inferenceJobToken` is already in history, it's a no-op so we
   * don't duplicate cards.
   */
  seedFromSession: (item: VFXResult) => void;
  /**
   * Replace the persisted source/reference media for an existing history
   * item — used after session sync to upgrade local blob: URLs (which die
   * on refresh) to the CDN URLs the server has.
   */
  updateMediaForResult: (
    id: string,
    media: { source?: VFXMediaRef; reference?: VFXMediaRef; prompt?: string },
  ) => void;
  reset: () => void;
};

export const useVFXStore = create<VFXState>()(
  persist(
    (set, get) => ({
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

      attachJobToken: (id, token) => {
        set((s) => ({
          history: s.history.map((r) =>
            r.id === id ? { ...r, inferenceJobToken: token } : r,
          ),
        }));
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

      seedFromSession: (item) => {
        set((s) => {
          if (
            item.inferenceJobToken &&
            s.history.some(
              (r) => r.inferenceJobToken === item.inferenceJobToken,
            )
          ) {
            return s;
          }
          return { history: [item, ...s.history] };
        });
      },

      updateMediaForResult: (id, media) => {
        set((s) => ({
          history: s.history.map((r) => {
            if (r.id !== id) return r;
            const next: VFXResult = { ...r };
            // Only overwrite when the existing url looks like a dead blob:
            // URL or is missing. CDN URLs already in place are left alone.
            const isBlob = (u?: string) =>
              !!u && u.startsWith("blob:");
            if (
              media.source &&
              (!r.source || isBlob(r.source.url))
            ) {
              next.source = media.source;
            }
            if (
              media.reference &&
              (!r.reference || isBlob(r.reference.url))
            ) {
              next.reference = media.reference;
            }
            if (
              typeof media.prompt === "string" &&
              media.prompt.length > 0 &&
              (!r.prompt || r.prompt.length === 0)
            ) {
              next.prompt = media.prompt;
            }
            return next;
          }),
        }));
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
    }),
    {
      name: "artcraft-vfx-store",
      // Persist the history (pending + complete + failed) and the user's
      // text prompt across reloads. Source/mask/reference are skipped — their
      // preview URLs are blob: URLs that don't survive a refresh.
      partialize: (state) => ({
        history: state.history,
        prompt: state.prompt,
        resolution: state.resolution,
        selectedModelId: state.selectedModelId,
      }),
    },
  ),
);
