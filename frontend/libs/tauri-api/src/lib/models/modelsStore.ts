// Shared model store: the single source of truth for the model dropdowns.
//
// Seeded synchronously from the frontend OVERLAY (`IMAGE_MODELS` / `VIDEO_MODELS`
// in `@storyteller/model-list`) so the UI is never empty. On app boot,
// `loadModelsFromBackend()` fetches the authoritative omni listing via the Tauri
// commands and rebuilds the lists FROM that response (membership + order come
// from the backend; the overlay only enriches UI metadata; backend models with
// no overlay entry are built minimally so NEW models appear). If the fetch fails
// the store keeps the overlay.

import { create } from "zustand";
import {
  ImageModel,
  VideoModel,
  IMAGE_MODELS,
  VIDEO_MODELS,
  buildImageModelsFromListing,
  buildVideoModelsFromListing,
} from "@storyteller/model-list";
import { ListImageModels } from "../generate/models/image/ListImageModels.js";
import { ListVideoModels } from "../generate/models/video/ListVideoModels.js";

export interface ModelsStoreState {
  imageModels: ImageModel[];
  videoModels: VideoModel[];
  // True once a backend reconciliation has completed at least once.
  loaded: boolean;
  isLoading: boolean;
  loadModelsFromBackend: () => Promise<void>;
}

export const useModelsStore = create<ModelsStoreState>((set, get) => ({
  imageModels: IMAGE_MODELS,
  videoModels: VIDEO_MODELS,
  loaded: false,
  isLoading: false,
  loadModelsFromBackend: async () => {
    if (get().isLoading) return;
    console.log("[models] loadModelsFromBackend() — calling Tauri commands…");
    set({ isLoading: true });

    const [imageResult, videoResult] = await Promise.allSettled([
      ListImageModels(),
      ListVideoModels(),
    ]);

    const next: Partial<ModelsStoreState> = { isLoading: false, loaded: true };

    if (imageResult.status === "fulfilled") {
      const { models } = imageResult.value.payload;
      const built = buildImageModelsFromListing(IMAGE_MODELS, models);
      next.imageModels = built;
      console.log(
        `[models] image: backend returned ${models.length} → ${built.length} models shown`,
        built.map((m) => m.tauriId),
      );
    } else {
      console.error("[models] failed to load image models from backend:", imageResult.reason);
    }

    if (videoResult.status === "fulfilled") {
      const { models } = videoResult.value.payload;
      const built = buildVideoModelsFromListing(VIDEO_MODELS, models);
      next.videoModels = built;
      console.log(
        `[models] video: backend returned ${models.length} → ${built.length} models shown`,
        built.map((m) => m.tauriId),
      );
    } else {
      console.error("[models] failed to load video models from backend:", videoResult.reason);
    }

    set(next);
  },
}));

// Hook selectors for React consumers.
export const useImageModels = (): ImageModel[] => useModelsStore((s) => s.imageModels);
export const useVideoModels = (): VideoModel[] => useModelsStore((s) => s.videoModels);
