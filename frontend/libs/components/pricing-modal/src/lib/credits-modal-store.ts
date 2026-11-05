// zustand: a tiny state library. `create` builds a store (a shared object any component can read from or change) and returns a hook to use it.
import { create } from "zustand";

// What the Credits dialog's store holds (just whether it is showing) and the three ways to change it.
interface CreditsModalState {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  toggleModal: () => void;
}

// The store behind the "Buy credits" dialog (credits-modal.tsx). Callers: pricing-modal.tsx calls openModal from its "Buy credits" buttons,
// TopBar.tsx and BillingSettingsPane.tsx call toggleModal, and MainApp.tsx reads isOpen and closeModal and passes them to the dialog.
export const useCreditsModalStore = create<CreditsModalState>((set) => ({
  // Starts closed.
  isOpen: false,
  // Shows the dialog.
  openModal: () => set({ isOpen: true }),
  // Hides the dialog.
  closeModal: () => set({ isOpen: false }),
  // Flips between shown and hidden.
  toggleModal: () => set((state) => ({ isOpen: !state.isOpen })),
}));
