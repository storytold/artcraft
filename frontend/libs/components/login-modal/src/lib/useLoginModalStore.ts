import { create } from "zustand";

interface LoginModalStore {
  isOpen: boolean;
  recheckTrigger: number;
  openModal: () => void;
  closeModal: () => void;
  triggerRecheck: () => void;
}

export const useLoginModalStore = create<LoginModalStore>((set) => ({
  isOpen: false,
  recheckTrigger: 0,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
  triggerRecheck: () =>
    set((state) => ({ recheckTrigger: state.recheckTrigger + 1 })),
}));
