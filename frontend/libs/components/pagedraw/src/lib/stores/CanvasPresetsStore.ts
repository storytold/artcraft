import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createCustomPreset,
  parseCustomPresets,
  toCustomPresetInput,
  type CanvasSizePreset,
  type CustomCanvasPresetInput,
} from "@storyteller/common";

// Canvas sizes the user saves in the canvas size dialog, kept in local
// storage. Only what the user typed is stored; the presets are rebuilt from it
// on load, and an entry that is no longer valid is dropped.

interface CanvasPresetsState {
  /** In the order they were saved. */
  customPresets: CanvasSizePreset[];
  addCustomPreset: (input: CustomCanvasPresetInput) => CanvasSizePreset;
  removeCustomPreset: (id: string) => void;
}

export const useCanvasPresetsStore = create<CanvasPresetsState>()(
  persist(
    (set) => ({
      customPresets: [],

      addCustomPreset: (input) => {
        const preset = createCustomPreset(
          `custom-${crypto.randomUUID()}`,
          input,
        );
        set((s) => ({ customPresets: [...s.customPresets, preset] }));
        return preset;
      },

      removeCustomPreset: (id) =>
        set((s) => ({
          customPresets: s.customPresets.filter((preset) => preset.id !== id),
        })),
    }),
    {
      name: "artcraft-canvas-presets",
      version: 1,
      partialize: (s) => ({
        customPresets: s.customPresets.map((preset) => ({
          id: preset.id,
          ...toCustomPresetInput(preset),
        })),
      }),
      merge: (persisted, current) => ({
        ...current,
        customPresets: parseCustomPresets(
          (persisted as { customPresets?: unknown } | undefined)?.customPresets,
        ),
      }),
    },
  ),
);
