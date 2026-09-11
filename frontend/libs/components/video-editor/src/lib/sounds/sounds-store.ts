import { create } from "zustand";
import type { SoundEffect, SavedSound } from "./types";
import { EditorCore } from "../core";
import { buildLibraryAudioElement } from "../timeline/element-utils";
import { mediaTimeFromSeconds } from "../wasm";

interface SoundsStore {
  topSoundEffects: SoundEffect[];
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
  showCommercialOnly: boolean;
  toggleCommercialFilter: () => void;
  searchQuery: string;
  searchResults: SoundEffect[];
  isSearching: boolean;
  searchError: string | null;
  lastSearchQuery: string;
  scrollPosition: number;
  currentPage: number;
  hasNextPage: boolean;
  totalCount: number;
  isLoadingMore: boolean;
  savedSounds: SavedSound[];
  isSavedSoundsLoaded: boolean;
  isLoadingSavedSounds: boolean;
  savedSoundsError: string | null;

  addSoundToTimeline: ({ sound }: { sound: SoundEffect }) => Promise<boolean>;
  setTopSoundEffects: ({ sounds }: { sounds: SoundEffect[] }) => void;
  setLoading: ({ loading }: { loading: boolean }) => void;
  setError: ({ error }: { error: string | null }) => void;
  setHasLoaded: ({ loaded }: { loaded: boolean }) => void;
  setSearchQuery: ({ query }: { query: string }) => void;
  setSearchResults: ({ results }: { results: SoundEffect[] }) => void;
  setSearching: ({ searching }: { searching: boolean }) => void;
  setSearchError: ({ error }: { error: string | null }) => void;
  setLastSearchQuery: ({ query }: { query: string }) => void;
  setScrollPosition: ({ position }: { position: number }) => void;
  setCurrentPage: ({ page }: { page: number }) => void;
  setHasNextPage: ({ hasNext }: { hasNext: boolean }) => void;
  setTotalCount: ({ count }: { count: number }) => void;
  setLoadingMore: ({ loading }: { loading: boolean }) => void;
  appendSearchResults: ({ results }: { results: SoundEffect[] }) => void;
  appendTopSounds: ({ results }: { results: SoundEffect[] }) => void;
  resetPagination: () => void;
  loadSavedSounds: () => Promise<void>;
  saveSoundEffect: ({
    soundEffect,
  }: {
    soundEffect: SoundEffect;
  }) => Promise<void>;
  removeSavedSound: ({ soundId }: { soundId: number }) => Promise<void>;
  isSoundSaved: ({ soundId }: { soundId: number }) => boolean;
  toggleSavedSound: ({
    soundEffect,
  }: {
    soundEffect: SoundEffect;
  }) => Promise<void>;
  clearSavedSounds: () => Promise<void>;
}

function buildSavedSoundFromEffect({
  soundEffect,
}: {
  soundEffect: SoundEffect;
}): SavedSound {
  return {
    id: soundEffect.id,
    name: soundEffect.name,
    username: soundEffect.username,
    previewUrl: soundEffect.previewUrl,
    downloadUrl: soundEffect.downloadUrl,
    duration: soundEffect.duration,
    tags: soundEffect.tags,
    license: soundEffect.license,
    savedAt: new Date().toISOString(),
  };
}

export const useSoundsStore = create<SoundsStore>((set, get) => ({
  topSoundEffects: [],
  isLoading: false,
  error: null,
  hasLoaded: false,
  showCommercialOnly: true,

  toggleCommercialFilter: () => {
    set((state) => ({ showCommercialOnly: !state.showCommercialOnly }));
  },

  searchQuery: "",
  searchResults: [],
  isSearching: false,
  searchError: null,
  lastSearchQuery: "",
  scrollPosition: 0,
  currentPage: 1,
  hasNextPage: false,
  totalCount: 0,
  isLoadingMore: false,
  savedSounds: [],
  isSavedSoundsLoaded: false,
  isLoadingSavedSounds: false,
  savedSoundsError: null,

  setTopSoundEffects: ({ sounds }) => set({ topSoundEffects: sounds }),
  setLoading: ({ loading }) => set({ isLoading: loading }),
  setError: ({ error }) => set({ error }),
  setHasLoaded: ({ loaded }) => set({ hasLoaded: loaded }),
  setSearchQuery: ({ query }) => set({ searchQuery: query }),
  setSearchResults: ({ results }) =>
    set({ searchResults: results, currentPage: 1 }),
  setSearching: ({ searching }) => set({ isSearching: searching }),
  setSearchError: ({ error }) => set({ searchError: error }),
  setLastSearchQuery: ({ query }) => set({ lastSearchQuery: query }),
  setScrollPosition: ({ position }) => set({ scrollPosition: position }),
  setCurrentPage: ({ page }) => set({ currentPage: page }),
  setHasNextPage: ({ hasNext }) => set({ hasNextPage: hasNext }),
  setTotalCount: ({ count }) => set({ totalCount: count }),
  setLoadingMore: ({ loading }) => set({ isLoadingMore: loading }),

  appendSearchResults: ({ results }) =>
    set((state) => ({
      searchResults: [...state.searchResults, ...results],
    })),

  appendTopSounds: ({ results }) =>
    set((state) => ({
      topSoundEffects: [...state.topSoundEffects, ...results],
    })),

  resetPagination: () =>
    set({
      currentPage: 1,
      hasNextPage: false,
      totalCount: 0,
      isLoadingMore: false,
    }),

  loadSavedSounds: async () => {
    if (get().isSavedSoundsLoaded) return;

    try {
      set({ isLoadingSavedSounds: true, savedSoundsError: null });
      const editor = EditorCore.getInstance();
      const sounds = await editor.adapters.soundsAdapter.loadSavedSounds();
      set({
        savedSounds: sounds,
        isSavedSoundsLoaded: true,
        isLoadingSavedSounds: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load saved sounds";
      set({
        savedSoundsError: errorMessage,
        isLoadingSavedSounds: false,
      });
      console.error("Failed to load saved sounds:", error);
    }
  },

  saveSoundEffect: async ({ soundEffect }) => {
    try {
      const editor = EditorCore.getInstance();
      await editor.adapters.soundsAdapter.saveSound({ sound: soundEffect });

      // Optimistically update the in-store collection. The adapter
      // owns the source of truth; we re-load the next time the panel
      // opens to reconcile.
      set((state) => {
        const exists = state.savedSounds.some(
          (sound) => sound.id === soundEffect.id,
        );
        if (exists) return state;
        return {
          savedSounds: [
            ...state.savedSounds,
            buildSavedSoundFromEffect({ soundEffect }),
          ],
        };
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save sound";
      set({ savedSoundsError: errorMessage });
      EditorCore.getInstance().adapters.toast.error("Failed to save sound");
      console.error("Failed to save sound:", error);
    }
  },

  removeSavedSound: async ({ soundId }) => {
    try {
      const editor = EditorCore.getInstance();
      await editor.adapters.soundsAdapter.unsaveSound({ soundId });

      set((state) => ({
        savedSounds: state.savedSounds.filter((sound) => sound.id !== soundId),
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to remove sound";
      set({ savedSoundsError: errorMessage });
      EditorCore.getInstance().adapters.toast.error("Failed to remove sound");
      console.error("Failed to remove sound:", error);
    }
  },

  isSoundSaved: ({ soundId }) => {
    const { savedSounds } = get();
    return savedSounds.some((sound) => sound.id === soundId);
  },

  toggleSavedSound: async ({ soundEffect }) => {
    const { isSoundSaved, saveSoundEffect, removeSavedSound } = get();

    if (isSoundSaved({ soundId: soundEffect.id })) {
      await removeSavedSound({ soundId: soundEffect.id });
    } else {
      await saveSoundEffect({ soundEffect });
    }
  },

  clearSavedSounds: async () => {
    try {
      const editor = EditorCore.getInstance();
      await editor.adapters.soundsAdapter.clearSavedSounds();
      set({
        savedSounds: [],
        savedSoundsError: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to clear saved sounds";
      set({ savedSoundsError: errorMessage });
      EditorCore.getInstance().adapters.toast.error(
        "Failed to clear saved sounds",
      );
      console.error("Failed to clear saved sounds:", error);
    }
  },

  addSoundToTimeline: async ({ sound }) => {
    const editor = EditorCore.getInstance();
    let audioUrl = sound.previewUrl;
    if (!audioUrl) {
      try {
        audioUrl = await editor.adapters.soundsAdapter.resolveAudioUrl({
          soundId: sound.id,
        });
      } catch (error) {
        console.error("Failed to resolve audio url:", error);
      }
    }
    if (!audioUrl) {
      editor.adapters.toast.error("Sound file not available");
      return false;
    }

    try {
      const currentTime = editor.playback.getCurrentTime();

      const response = await fetch(audioUrl);
      if (!response.ok)
        throw new Error(`Failed to download audio: ${response.statusText}`);

      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new AudioContext();
      const buffer = await audioContext.decodeAudioData(arrayBuffer);

      const element = buildLibraryAudioElement({
        sourceUrl: audioUrl,
        name: sound.name,
        duration: mediaTimeFromSeconds({ seconds: sound.duration }),
        startTime: currentTime,
        buffer,
      });

      editor.timeline.insertElement({
        placement: { mode: "auto", trackType: "audio" },
        element,
      });
      return true;
    } catch (error) {
      console.error("Failed to add sound to timeline:", error);
      editor.adapters.toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add sound to timeline",
      );
      return false;
    }
  },
}));
