import { create } from "zustand";
import { ModelPage } from "@storyteller/ui-model-selector";

interface CostBreakdownModalState {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  toggleModal: () => void;
  estimatedCreditsByPage: Partial<Record<ModelPage, number | null>>;
  setEstimatedCreditsForPage: (
    page: ModelPage,
    credits: number | null,
  ) => void;
}

export const useCostBreakdownModalStore = create<CostBreakdownModalState>(
  (set) => ({
    isOpen: false,
    openModal: () => set({ isOpen: true }),
    closeModal: () => set({ isOpen: false }),
    toggleModal: () => set((state) => ({ isOpen: !state.isOpen })),
    estimatedCreditsByPage: {},
    setEstimatedCreditsForPage: (page, credits) =>
      set((state) => ({
        estimatedCreditsByPage: {
          ...state.estimatedCreditsByPage,
          [page]: credits,
        },
      })),
  }),
);

// Map TabId to ModelPage
export const TAB_TO_MODEL_PAGE: Record<string, ModelPage> = {
  IMAGE: ModelPage.TextToImage,
  VIDEO: ModelPage.ImageToVideo,
  "2D": ModelPage.Canvas2D,
  "3D": ModelPage.Stage3D,
  EDIT: ModelPage.ImageEditor,
};
