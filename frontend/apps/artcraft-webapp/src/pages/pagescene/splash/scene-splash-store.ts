// Shared visibility store for the edit-3D splash. Lets the auto-open
// hook, the adapter (File > New Scene), and the modal subscribe to one
// source of truth without rebuilding the adapter on toggle.

import { create } from "zustand";

interface SceneSplashState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useSceneSplashStore = create<SceneSplashState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
