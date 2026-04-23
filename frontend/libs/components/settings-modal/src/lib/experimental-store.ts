import { create } from "zustand";

const ENABLED_STORAGE_KEY = "artcraft_experimental_enabled";
const STORYBOARD_STORAGE_KEY = "artcraft_experimental_storyboard_page";
const MOODBOARD_STORAGE_KEY = "artcraft_experimental_moodboard_page";
const MOODBOARD_HTML_STORAGE_KEY = "artcraft_experimental_moodboard_html_page";

const readBoolFlag = (key: string): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
};

const writeBoolFlag = (key: string, enabled: boolean) => {
  if (typeof window === "undefined") return;
  try {
    if (enabled) {
      window.localStorage.setItem(key, "true");
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore storage failures
  }
};

interface ExperimentalState {
  enabled: boolean;
  storyboardPageEnabled: boolean;
  moodboardPageEnabled: boolean;
  moodboardHtmlPageEnabled: boolean;
  enable: () => void;
  disable: () => void;
  setStoryboardPageEnabled: (enabled: boolean) => void;
  setMoodboardPageEnabled: (enabled: boolean) => void;
  setMoodboardHtmlPageEnabled: (enabled: boolean) => void;
}

export const useExperimentalStore = create<ExperimentalState>((set) => ({
  enabled: readBoolFlag(ENABLED_STORAGE_KEY),
  storyboardPageEnabled: readBoolFlag(STORYBOARD_STORAGE_KEY),
  moodboardPageEnabled: readBoolFlag(MOODBOARD_STORAGE_KEY),
  moodboardHtmlPageEnabled: readBoolFlag(MOODBOARD_HTML_STORAGE_KEY),
  enable: () => {
    writeBoolFlag(ENABLED_STORAGE_KEY, true);
    set({ enabled: true });
  },
  disable: () => {
    // Resetting experimental clears every gated feature flag too.
    writeBoolFlag(ENABLED_STORAGE_KEY, false);
    writeBoolFlag(STORYBOARD_STORAGE_KEY, false);
    writeBoolFlag(MOODBOARD_STORAGE_KEY, false);
    writeBoolFlag(MOODBOARD_HTML_STORAGE_KEY, false);
    set({
      enabled: false,
      storyboardPageEnabled: false,
      moodboardPageEnabled: false,
      moodboardHtmlPageEnabled: false,
    });
  },
  setStoryboardPageEnabled: (enabled: boolean) => {
    writeBoolFlag(STORYBOARD_STORAGE_KEY, enabled);
    set({ storyboardPageEnabled: enabled });
  },
  setMoodboardPageEnabled: (enabled: boolean) => {
    writeBoolFlag(MOODBOARD_STORAGE_KEY, enabled);
    set({ moodboardPageEnabled: enabled });
  },
  setMoodboardHtmlPageEnabled: (enabled: boolean) => {
    writeBoolFlag(MOODBOARD_HTML_STORAGE_KEY, enabled);
    set({ moodboardHtmlPageEnabled: enabled });
  },
}));

export const useStoryboardPageEnabled = () =>
  useExperimentalStore((s) => s.enabled && s.storyboardPageEnabled);

export const useMoodboardPageEnabled = () =>
  useExperimentalStore((s) => s.enabled && s.moodboardPageEnabled);

export const useMoodboardHtmlPageEnabled = () =>
  useExperimentalStore((s) => s.enabled && s.moodboardHtmlPageEnabled);
