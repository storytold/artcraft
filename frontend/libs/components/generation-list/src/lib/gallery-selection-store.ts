import { create } from "zustand";

// Multi-select state for the create-page generation feeds. Shared between the
// TopBar "Select" toggle, the gallery views (checkbox overlays), and the
// floating SelectionActionBar. Not persisted — selection is ephemeral, and
// hosts clear it on unmount so it can't leak across pages.

interface GallerySelectionState {
  active: boolean;
  ids: Set<string>;
  // Leaving select mode always drops the current selection.
  setActive: (active: boolean) => void;
  toggle: (id: string) => void;
  clear: () => void;
}

export const useGallerySelectionStore = create<GallerySelectionState>(
  (set) => ({
    active: false,
    ids: new Set<string>(),
    setActive: (active) =>
      set(active ? { active } : { active, ids: new Set<string>() }),
    toggle: (id) =>
      set((state) => {
        const ids = new Set(state.ids);
        if (ids.has(id)) {
          ids.delete(id);
        } else {
          ids.add(id);
        }
        return { ids };
      }),
    clear: () => set({ ids: new Set<string>() }),
  }),
);
