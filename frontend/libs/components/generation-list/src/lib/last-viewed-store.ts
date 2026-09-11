import { create } from "zustand";

// Remembers the generation most recently viewed in a lightbox opened from a
// create-page feed, so the feed can badge that tile after the lightbox
// closes. Set on every lightbox show (prev/next included). Module-level so it
// survives page remounts (tab switch, route change); in-memory only.
// Lightboxes opened elsewhere (library, task queue) intentionally do not move
// the marker.

interface LastViewedGenerationState {
  id: string | null;
  setId: (id: string) => void;
}

export const useLastViewedGenerationStore = create<LastViewedGenerationState>(
  (set) => ({
    id: null,
    setId: (id) => set({ id }),
  }),
);
