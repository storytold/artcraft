import { create } from "zustand";
import { persist } from "zustand/middleware";

// View mode for the create-page generation galleries. Shared between the
// create pages and the TopBar toggle, and persisted so the user's preference
// survives reloads and carries across pages.

export type GalleryViewMode = "grid" | "list";

interface GalleryViewState {
  viewMode: GalleryViewMode;
  setViewMode: (mode: GalleryViewMode) => void;
}

export const useGalleryViewStore = create<GalleryViewState>()(
  persist(
    (set) => ({
      viewMode: "grid",
      setViewMode: (viewMode) => set({ viewMode }),
    }),
    { name: "artcraft-gallery-view" },
  ),
);
