import { create } from "zustand";

interface EditorUIStore {
  isInitializing: boolean;
  setInitializing: (v: boolean) => void;
}

export const useEditorUIStore = create<EditorUIStore>()((set) => ({
  isInitializing: true,
  setInitializing: (isInitializing) => set({ isInitializing }),
}));
