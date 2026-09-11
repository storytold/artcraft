import { create } from "zustand";
import { persist } from "zustand/middleware";

// View mode for the create-page generation galleries. Shared between the
// create pages and the TopBar toggle, and persisted so the user's preference
// survives reloads and carries across pages.

export type GalleryViewMode = "grid" | "list";

interface GalleryViewState {
  viewMode: GalleryViewMode;
  setViewMode: (mode: GalleryViewMode) => void;
  // Whether video cards play their animated previews. When off, they show the
  // still first-frame thumbnail instead (toggled from the video page TopBar).
  autoplayVideos: boolean;
  setAutoplayVideos: (autoplay: boolean) => void;
}

export const useGalleryViewStore = create<GalleryViewState>()(
  persist(
    (set) => ({
      viewMode: "grid",
      setViewMode: (viewMode) => set({ viewMode }),
      autoplayVideos: true,
      setAutoplayVideos: (autoplayVideos) => set({ autoplayVideos }),
    }),
    { name: "artcraft-gallery-view" },
  ),
);
