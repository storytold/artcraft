import { create } from "zustand";

// Remembers the generation most recently viewed in the lightbox from a
// desktop create-page feed, so the feed can badge that tile after the
// lightbox closes. Set on every openInLightbox call (prev/next included).
// Module-level so it survives create pages remounting on tab switch;
// in-memory only. Lightboxes opened elsewhere (library modal, task queue)
// intentionally do not move the marker.

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
