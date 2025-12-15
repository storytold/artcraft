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
  // Image data
  images: ProcessedImage[];
  activeImageId: string | null;

  // Processing state
  isProcessing: boolean;
  currentOriginalUrl: string;
  pendingJobId: string | null;

  // Animation state
  revealProgress: number;
  isAnimating: boolean;
  isHoldingCompare: boolean;

  // Image dimensions
  imageDimensions: ImageDimensions | null;

  // Actions
  addImage: (image: ProcessedImage) => void;
  setActiveImage: (id: string | null) => void;
  getActiveImage: () => ProcessedImage | null;
  setIsProcessing: (value: boolean) => void;
  setCurrentOriginalUrl: (url: string) => void;
  setPendingJobId: (id: string | null) => void;
  setRevealProgress: (value: number) => void;
  setIsAnimating: (value: boolean) => void;
  setIsHoldingCompare: (value: boolean) => void;
  setImageDimensions: (dimensions: ImageDimensions | null) => void;
  resetAnimationState: () => void;
  clearAll: () => void;
}

export const useRemoveBackgroundStore = create<RemoveBackgroundState>(
  (set, get) => ({
    // Initial state
    images: [],
    activeImageId: null,
    isProcessing: false,
    currentOriginalUrl: "",
    pendingJobId: null,
    revealProgress: 0,
    isAnimating: false,
    isHoldingCompare: false,
    imageDimensions: null,

    // Actions
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

    setRevealProgress: (value) => {
      set({ revealProgress: value });
    },

    setIsAnimating: (value) => {
      set({ isAnimating: value });
    },

    setIsHoldingCompare: (value) => {
      set({ isHoldingCompare: value });
    },

    setImageDimensions: (dimensions) => {
      set({ imageDimensions: dimensions });
    },

    resetAnimationState: () => {
      set({
        isAnimating: false,
        revealProgress: 0,
        isHoldingCompare: false,
      });
    },

    clearAll: () => {
      set({
        images: [],
        activeImageId: null,
        isProcessing: false,
        currentOriginalUrl: "",
        pendingJobId: null,
        revealProgress: 0,
        isAnimating: false,
        isHoldingCompare: false,
        imageDimensions: null,
      });
    },
  }),
);
