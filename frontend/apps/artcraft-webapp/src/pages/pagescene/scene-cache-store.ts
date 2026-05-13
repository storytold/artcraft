import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Holds the serialized 3D editor scene JSON so the user's in-progress
// editor state survives navigating away to other webapp pages (e.g.
// browsing /gallery, kicking off a /create-image generation) and
// coming back. Mirrors how Tauri's useTabStore caches per-tab JSON
// across tab switches — sessionStorage is the webapp equivalent: it
// covers SPA navigation AND tab reloads, but doesn't bleed into other
// browser sessions or tabs.
interface SceneCacheStore {
  cacheJsonString: string | undefined;
  setCacheJsonString: (json: string | undefined) => void;
  clear: () => void;
}

export const useSceneCacheStore = create<SceneCacheStore>()(
  persist(
    (set) => ({
      cacheJsonString: undefined,
      setCacheJsonString: (cacheJsonString) => set({ cacheJsonString }),
      clear: () => set({ cacheJsonString: undefined }),
    }),
    {
      name: "artcraft-webapp-pagescene-cache",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
