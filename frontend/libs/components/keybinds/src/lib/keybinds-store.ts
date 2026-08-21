import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ActionId, Binding, PresetId } from "./types";
import { BASE_BINDINGS, DEFAULT_PRESET, PRESETS } from "./presets";
import { ACTIONS, actionsCoAvailable } from "./registry";
import { bindingsEqual } from "./matcher";

// Persisted, app-wide keybinds state. Resolution layers, highest priority first:
//   1. user override for the action
//   2. selected preset's delta for the action (3D-only)
//   3. BASE_BINDINGS (the "Gamer" default)
// Modeled on the video-editor's keybindings-store (zustand + persist), but keyed
// by stable action ids with a preset+override layering instead of a flat map.

interface KeybindsState {
  selectedPreset: PresetId;
  overrides: Record<ActionId, Binding[]>;
  isRecording: boolean;

  setPreset: (preset: PresetId) => void;
  setBinding: (id: ActionId, bindings: Binding[]) => void;
  resetAction: (id: ActionId) => void; // drop override → back to preset/base
  resetAll: () => void; // clear all overrides, keep preset
  resetToPresetDefault: () => void; // clear overrides AND return to default preset
  setIsRecording: (v: boolean) => void;

  resolveBindings: (id: ActionId) => Binding[];
  /** Action ids in the SAME surface already bound to `candidate`. */
  findConflicts: (id: ActionId, candidate: Binding) => ActionId[];
}

function resolveFrom(
  overrides: Record<ActionId, Binding[]>,
  preset: PresetId,
  id: ActionId,
): Binding[] {
  return overrides[id] ?? PRESETS[preset].bindings[id] ?? BASE_BINDINGS[id] ?? [];
}

export const useKeybindsStore = create<KeybindsState>()(
  persist(
    (set, get) => ({
      selectedPreset: DEFAULT_PRESET,
      overrides: {},
      isRecording: false,

      setPreset: (preset) => set({ selectedPreset: preset }),

      setBinding: (id, bindings) =>
        set((s) => ({ overrides: { ...s.overrides, [id]: bindings } })),

      resetAction: (id) =>
        set((s) => {
          const next = { ...s.overrides };
          delete next[id];
          return { overrides: next };
        }),

      resetAll: () => set({ overrides: {} }),

      resetToPresetDefault: () =>
        set({ overrides: {}, selectedPreset: DEFAULT_PRESET }),

      setIsRecording: (isRecording) => set({ isRecording }),

      resolveBindings: (id) => {
        const { overrides, selectedPreset } = get();
        return resolveFrom(overrides, selectedPreset, id);
      },

      findConflicts: (id, candidate) => {
        const action = ACTIONS[id];
        if (!action) return [];
        const { overrides, selectedPreset } = get();
        const conflicts: ActionId[] = [];
        for (const other of Object.values(ACTIONS)) {
          if (other.id === id || other.surface !== action.surface) continue;
          // Context-exclusive actions (their `when` gates never hold at the
          // same time) may share a key on purpose — not a conflict.
          if (!actionsCoAvailable(action, other)) continue;
          const bindings = resolveFrom(overrides, selectedPreset, other.id);
          if (bindings.some((bd) => bindingsEqual(bd, candidate))) {
            conflicts.push(other.id);
          }
        }
        return conflicts;
      },
    }),
    {
      name: "artcraft-keybinds",
      version: 1,
      partialize: (s) => ({
        selectedPreset: s.selectedPreset,
        overrides: s.overrides,
      }),
    },
  ),
);
