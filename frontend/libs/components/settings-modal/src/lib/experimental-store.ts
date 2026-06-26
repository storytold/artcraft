import { create } from "zustand";

const ENABLED_STORAGE_KEY = "artcraft_experimental_enabled";
const STORYBOARD_STORAGE_KEY = "artcraft_experimental_storyboard_page";
// Read directly by the pagescene lib (it can't import this store without
// inverting lib layering), so the key string is a cross-lib contract.
const SCENE_ENHANCEMENT_STORAGE_KEY =
  "artcraft_experimental_scene_enhancement";

// Same-tab broadcast so other libs that read these flags off localStorage
// can refresh reactively (the native `storage` event only fires in *other*
// tabs). Listeners: see useExperimentalFlag in @storyteller/ui-pagescene.
export const EXPERIMENTAL_FLAGS_CHANGED_EVENT = "artcraft_experimental_changed";

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
  try {
    window.dispatchEvent(
      new CustomEvent(EXPERIMENTAL_FLAGS_CHANGED_EVENT, {
        detail: { key, enabled },
      }),
    );
  } catch {
    // ignore dispatch failures
  }
};

interface ExperimentalState {
  enabled: boolean;
  storyboardPageEnabled: boolean;
  sceneEnhancementEnabled: boolean;
  enable: () => void;
  disable: () => void;
  setStoryboardPageEnabled: (enabled: boolean) => void;
  setSceneEnhancementEnabled: (enabled: boolean) => void;
}

export const useExperimentalStore = create<ExperimentalState>((set) => ({
  enabled: readBoolFlag(ENABLED_STORAGE_KEY),
  storyboardPageEnabled: readBoolFlag(STORYBOARD_STORAGE_KEY),
  sceneEnhancementEnabled: readBoolFlag(SCENE_ENHANCEMENT_STORAGE_KEY),
  enable: () => {
    writeBoolFlag(ENABLED_STORAGE_KEY, true);
    set({ enabled: true });
  },
  disable: () => {
    // Resetting experimental clears every gated feature flag too.
    writeBoolFlag(ENABLED_STORAGE_KEY, false);
    writeBoolFlag(STORYBOARD_STORAGE_KEY, false);
    writeBoolFlag(SCENE_ENHANCEMENT_STORAGE_KEY, false);
    set({
      enabled: false,
      storyboardPageEnabled: false,
      sceneEnhancementEnabled: false,
    });
  },
  setStoryboardPageEnabled: (enabled: boolean) => {
    writeBoolFlag(STORYBOARD_STORAGE_KEY, enabled);
    set({ storyboardPageEnabled: enabled });
  },
  setSceneEnhancementEnabled: (enabled: boolean) => {
    writeBoolFlag(SCENE_ENHANCEMENT_STORAGE_KEY, enabled);
    set({ sceneEnhancementEnabled: enabled });
  },
}));

export const useStoryboardPageEnabled = () =>
  useExperimentalStore((s) => s.enabled && s.storyboardPageEnabled);

export const useSceneEnhancementEnabled = () =>
  useExperimentalStore((s) => s.enabled && s.sceneEnhancementEnabled);
