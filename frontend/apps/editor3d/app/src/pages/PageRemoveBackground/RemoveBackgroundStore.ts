import { create } from "zustand";

export interface ProcessedImage {
  id: string;
  originalUrl: string;
  processedUrl: string;
  timestamp: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

interface RemoveBackgroundState {
  images: ProcessedImage[];
  activeImageId: string | null;
  isProcessing: boolean;
  currentOriginalUrl: string;
  pendingJobId: string | null;
  imageDimensions: ImageDimensions | null;
  pendingExternalUrl: string | null;

  addImage: (image: ProcessedImage) => void;
  setActiveImage: (id: string | null) => void;
  getActiveImage: () => ProcessedImage | null;
  setIsProcessing: (value: boolean) => void;
  setCurrentOriginalUrl: (url: string) => void;
  setPendingJobId: (id: string | null) => void;
  setImageDimensions: (dimensions: ImageDimensions | null) => void;
  setPendingExternalUrl: (url: string | null) => void;
  clearAll: () => void;
}

export const useRemoveBackgroundStore = create<RemoveBackgroundState>(
  (set, get) => ({
    images: [],
    activeImageId: null,
    isProcessing: false,
    currentOriginalUrl: "",
    pendingJobId: null,
    imageDimensions: null,
    pendingExternalUrl: null,

    addImage: (image) => {
      set((state) => ({
        images: [...state.images, image],
        activeImageId: image.id,
      }));
    },

    setActiveImage: (id) => {
      set({ activeImageId: id });
    },

    getActiveImage: () => {
      const state = get();
      return state.images.find((img) => img.id === state.activeImageId) ?? null;
    },

    setIsProcessing: (value) => {
      set({ isProcessing: value });
    },

    setCurrentOriginalUrl: (url) => {
      set({ currentOriginalUrl: url });
    },

    setPendingJobId: (id) => {
      set({ pendingJobId: id });
    },

    setImageDimensions: (dimensions) => {
      set({ imageDimensions: dimensions });
    },

    setPendingExternalUrl: (url) => {
      set({ pendingExternalUrl: url });
    },

    clearAll: () => {
      set({
        images: [],
        activeImageId: null,
        isProcessing: false,
        currentOriginalUrl: "",
        pendingJobId: null,
        imageDimensions: null,
        pendingExternalUrl: null,
      });
    },
  }),
);
