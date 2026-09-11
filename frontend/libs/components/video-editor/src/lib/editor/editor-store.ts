import { create } from "zustand";
import { DEFAULT_CANVAS_PRESETS } from "../canvas/sizes";
import type { TCanvasSize } from "../project/types";

// Top-level editor app-state. Tracks whether the lib's mount sequence
// (load project, hydrate panels, ready signals) has completed. UI gates
// the splash-vs-editor render on these flags.
//
// `initializeApp` is intentionally trivial — production hosts that
// need a real boot sequence (e.g. pull from server, sync media) wrap
// this with their own logic and call setInitializing/setPanelsReady
// imperatively.

interface EditorState {
  isInitializing: boolean;
  isPanelsReady: boolean;
  canvasPresets: TCanvasSize[];
  setInitializing: (loading: boolean) => void;
  setPanelsReady: (ready: boolean) => void;
  initializeApp: () => Promise<void>;
}

export const useEditorStore = create<EditorState>()((set) => ({
  isInitializing: true,
  isPanelsReady: false,
  canvasPresets: DEFAULT_CANVAS_PRESETS,
  setInitializing: (loading) => set({ isInitializing: loading }),
  setPanelsReady: (ready) => set({ isPanelsReady: ready }),
  initializeApp: async () => {
    set({ isInitializing: true, isPanelsReady: false });
    set({ isPanelsReady: true, isInitializing: false });
  },
}));
