import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Per-token scratch cache for the 3D editor.
//
// The lib gives the host two hooks: a `cacheJsonString` it'll restore
// from on mount (priority over re-fetching a sceneToken), and an
// `onSceneSerialized` callback it fires whenever the editor has fresh
// JSON to stash. We pair those with sessionStorage so SPA navigation,
// tab reloads, and Cmd+R survive — but a fresh browser session starts
// clean (no cross-user bleed).
//
// Each cache entry holds both the snapshot the host loaded from the
// server (`original`) and the user's latest in-progress state
// (`current`). The destructive "Reset to original" menu item is
// available iff `original` is defined for the active scene, and the
// reset flow just reads `original` and re-applies it via
// `editor.applyJson`.
//
// Playground sessions (no sceneToken in the URL) key on PLAYGROUND_KEY
// and don't track an `original` — there's no "server version" to revert
// to.

export const PLAYGROUND_KEY = "__playground__";

export interface SceneCacheEntry {
  original?: string;
  current: string;
}

interface SceneCacheStore {
  entries: Record<string, SceneCacheEntry>;
  getEntry: (token: string | undefined) => SceneCacheEntry | undefined;
  setOriginal: (token: string, original: string) => void;
  setCurrent: (token: string | undefined, current: string) => void;
  resetCurrentToOriginal: (token: string) => void;
  clearToken: (token: string | undefined) => void;
  // Most recent scene token the user actually visited via URL. Used by
  // the sidebar's "Edit 3D" link so clicking it after wandering off
  // returns the user to their last scene rather than the blank-scene
  // splash. Persists with the rest of this store in sessionStorage —
  // i.e. same tab only.
  lastVisitedSceneToken: string | undefined;
  setLastVisitedSceneToken: (token: string | undefined) => void;
}

const keyOf = (token: string | undefined) => token ?? PLAYGROUND_KEY;

export const useSceneCacheStore = create<SceneCacheStore>()(
  persist(
    (set, get) => ({
      entries: {},
      getEntry: (token) => get().entries[keyOf(token)],
      setOriginal: (token, original) =>
        set((state) => {
          const key = keyOf(token);
          const existing = state.entries[key];
          return {
            entries: {
              ...state.entries,
              [key]: {
                ...existing,
                original,
                current: existing?.current ?? original,
              },
            },
          };
        }),
      setCurrent: (token, current) =>
        set((state) => {
          const key = keyOf(token);
          const existing = state.entries[key];
          return {
            entries: {
              ...state.entries,
              [key]: { ...existing, current },
            },
          };
        }),
      resetCurrentToOriginal: (token) =>
        set((state) => {
          const key = keyOf(token);
          const existing = state.entries[key];
          if (!existing?.original) return state;
          return {
            entries: {
              ...state.entries,
              [key]: { ...existing, current: existing.original },
            },
          };
        }),
      clearToken: (token) =>
        set((state) => {
          const key = keyOf(token);
          if (!(key in state.entries)) return state;
          const next = { ...state.entries };
          delete next[key];
          return { entries: next };
        }),
      lastVisitedSceneToken: undefined,
      setLastVisitedSceneToken: (token) =>
        set({ lastVisitedSceneToken: token }),
    }),
    {
      name: "artcraft-webapp-pagescene-cache",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
