import { create } from "zustand";
import { persist } from "zustand/middleware";

// How the promptbox model pickers render their lists. Shared between the
// desktop app and the webapp (each toggles it from its Settings modal) and
// persisted so the preference survives reloads.

export type ModelPickerStyle = "grouped" | "flat";

interface ModelPickerStyleState {
  style: ModelPickerStyle;
  setStyle: (style: ModelPickerStyle) => void;
}

export const useModelPickerStyleStore = create<ModelPickerStyleState>()(
  persist(
    (set) => ({
      style: "grouped",
      setStyle: (style) => set({ style }),
    }),
    { name: "artcraft-model-picker-style" },
  ),
);
