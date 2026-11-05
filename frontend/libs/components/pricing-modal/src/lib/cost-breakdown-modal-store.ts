// zustand: a tiny state library. `create` builds a store (a shared object any component can read from or change) and returns a hook to use it.
import { create } from "zustand";
// ModelPage is the enum naming the app's eight pages; it is the key under which each page's price quote is kept.
import { ModelPage } from "@storyteller/ui-model-selector";

// What the Costs dialog's store holds and offers.
interface CostBreakdownModalState {
  // Whether the Costs dialog (cost-breakdown-modal.tsx) is showing.
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  toggleModal: () => void;
  // The latest price quote, in credits, per page. A page is missing from the object until its first quote starts; the value is null
  // while a quote is being fetched, after a failed one, or when the service gave no price (the dialog shows a dash for null).
  estimatedCreditsByPage: Partial<Record<ModelPage, number | null>>;
  // Writes one page's quote (or null) without touching the other pages' quotes.
  setEstimatedCreditsForPage: (
    page: ModelPage,
    credits: number | null,
  ) => void;
}

// The Costs dialog's store. Writers: the four quote hooks (useVideoCostEstimate, useImageCostEstimate, useSplatCostEstimate,
// useMeshCostEstimate), which cover separate sets of pages. Readers: CostBreakdownModal (the dialog), every CostCalculatorButton (the chip),
// and the Text to Image, Image to Video, Angles, Stage 3D and Image to 3D pages, which each read their own page's entry.
// openModal is called by CostCalculatorButton's click and by the "Cost calculator" button in the TopBar's credits menu (TopBar.tsx).
export const useCostBreakdownModalStore = create<CostBreakdownModalState>(
  (set) => ({
    // Starts closed.
    isOpen: false,
    // Shows the dialog.
    openModal: () => set({ isOpen: true }),
    // Hides the dialog.
    closeModal: () => set({ isOpen: false }),
    // Flips between shown and hidden.
    toggleModal: () => set((state) => ({ isOpen: !state.isOpen })),
    // No quotes yet.
    estimatedCreditsByPage: {},
    // Copies the existing quotes and sets (or replaces) just this page's entry; a new object is made each time so React sees the change.
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
// Translates the id of the active top-bar tab into the page whose quote the dialog should show. The keys are the tab ids as text
// (note "2D" and "3D" are quoted because they start with a digit). The dialog looks the active tab up here once (cost-breakdown-modal.tsx).
export const TAB_TO_MODEL_PAGE: Record<string, ModelPage> = {
  IMAGE: ModelPage.TextToImage,
  VIDEO: ModelPage.ImageToVideo,
  "2D": ModelPage.Canvas2D,
  "3D": ModelPage.Stage3D,
  EDIT: ModelPage.ImageEditor,
  IMAGE_TO_3D_WORLD: ModelPage.ImageTo3DWorld,
  IMAGE_TO_3D_OBJECT: ModelPage.ImageTo3DObject,
  ANGLES: ModelPage.Angles,
};
