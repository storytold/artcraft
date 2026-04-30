import { create } from "zustand";
import { persist } from "zustand/middleware";

interface EnterToGenerateStore {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const useEnterToGenerateStore = create<EnterToGenerateStore>()(
  persist(
    (set) => ({
      enabled: false,
      setEnabled: (enabled) => set({ enabled }),
    }),
    { name: "artcraft-website-enter-to-generate" },
  ),
);
