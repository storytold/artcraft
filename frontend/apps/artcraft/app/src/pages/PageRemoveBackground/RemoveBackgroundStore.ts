import { create } from "zustand";
import { listen } from "@tauri-apps/api/event";

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
  failProcessing: () => void;
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

    // The backend reports a failed job as "a remove_background job failed" with no job id. If this page is
    // waiting on a result, the spinner overlay must end. `pendingJobId` is kept on purpose: the event cannot
    // say whose job failed (the Draw page and the lightbox also start remove_background jobs), so if this
    // page's own job is still running its result must still be accepted when it arrives.
    failProcessing: () => {
      set((state) => (state.isProcessing ? { isProcessing: false } : state));
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

// A job can also fail after it was accepted (server error, input rejected). The backend then sends
// "generation-failed-event" with the action "remove_background" and no job id; without this listener the
// "Removing Background..." overlay stayed up, with Download and Compare disabled, until another image was sent.
listen<{ data?: { action?: string } }>("generation-failed-event", (event) => {
  if (event.payload?.data?.action !== "remove_background") return;
  useRemoveBackgroundStore.getState().failProcessing();
});
