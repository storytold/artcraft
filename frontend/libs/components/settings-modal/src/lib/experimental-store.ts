import { create } from "zustand";

const STORAGE_KEY = "artcraft_experimental_enabled";

const readInitial = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

const writeStorage = (enabled: boolean) => {
  if (typeof window === "undefined") return;
  try {
    if (enabled) {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage failures
  }
};

interface ExperimentalState {
  enabled: boolean;
  enable: () => void;
  disable: () => void;
}

export const useExperimentalStore = create<ExperimentalState>((set) => ({
  enabled: readInitial(),
  enable: () => {
    writeStorage(true);
    set({ enabled: true });
  },
  disable: () => {
    writeStorage(false);
    set({ enabled: false });
  },
}));
