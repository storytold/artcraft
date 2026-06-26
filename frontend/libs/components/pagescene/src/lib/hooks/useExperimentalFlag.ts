// Read an experimental feature flag without importing the settings-modal
// store (that lib sits above pagescene in the layering, so we can't depend
// on it). The flag's source of truth is localStorage; the settings store
// broadcasts an `artcraft_experimental_changed` CustomEvent on every
// toggle so we can refresh same-tab. The cross-tab `storage` event covers
// other tabs. The string keys + event name are the shared contract with
// experimental-store.ts.

import { useEffect, useState } from "react";

const MASTER_KEY = "artcraft_experimental_enabled";
const FLAGS_CHANGED_EVENT = "artcraft_experimental_changed";

const read = (featureKey: string): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.localStorage.getItem(MASTER_KEY) === "true" &&
      window.localStorage.getItem(featureKey) === "true"
    );
  } catch {
    return false;
  }
};

export function useExperimentalFlag(featureKey: string): boolean {
  const [enabled, setEnabled] = useState(() => read(featureKey));

  useEffect(() => {
    const refresh = () => setEnabled(read(featureKey));
    refresh();
    window.addEventListener(FLAGS_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(FLAGS_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [featureKey]);

  return enabled;
}

// The scene-enhancement feature gate. The flag lives in localStorage and
// is toggled from Settings → Experimental. In dev it's seeded on by the
// experimental store (the production 7-click unlock isn't reachable in
// every host, e.g. the webapp), so the panel shows by default in dev but
// the toggle still controls it.
export const SCENE_ENHANCEMENT_FLAG_KEY =
  "artcraft_experimental_scene_enhancement";

export const useSceneEnhancementFlag = () =>
  useExperimentalFlag(SCENE_ENHANCEMENT_FLAG_KEY);
