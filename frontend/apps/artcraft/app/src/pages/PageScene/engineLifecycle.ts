// External-facing lifecycle helpers for the 3D editor. These wrappers
// existed inside engine/editor.ts as a convenience facade for callers
// outside the engine (TopBar, appMenu, ImageTo3DExperience) — they
// belong here, not in the engine itself, because their sole purpose is
// to forward to PageSceneStore actions. Engine internals should emit
// EngineEvents on the bus instead of calling these.

import { usePageSceneStore } from "./PageSceneStore";

export const set3DPageMounted = (isMounted: boolean) =>
  usePageSceneStore.getState().set3DPageMounted(isMounted);

export const setIs3DEditorInitialized = (isInitialized: boolean) =>
  usePageSceneStore.getState().setIs3DEditorInitialized(isInitialized);

export const setIs3DSceneLoaded = (isLoaded: boolean) =>
  usePageSceneStore.getState().setIs3DSceneLoaded(isLoaded);
