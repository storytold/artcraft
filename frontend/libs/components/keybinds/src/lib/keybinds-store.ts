import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ActionId, Binding, PresetId, Surface } from "./types";
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
  /** Hold-to-peek cheatsheet stays open after the modifier is released,
   *  until Esc or a click outside dismisses it. */
  cheatsheetSticky: boolean;

  setPreset: (preset: PresetId) => void;
  setCheatsheetSticky: (v: boolean) => void;
  setBinding: (id: ActionId, bindings: Binding[]) => void;
  resetAction: (id: ActionId) => void; // drop override → back to preset/base
  resetSurface: (surface: Surface) => void; // clear one surface's overrides
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
  // FIX: `PRESETS[preset]` is undefined for a preset id this build does not know, and `.bindings` on it threw on every key
  // press. The optional chain falls back to BASE_BINDINGS for an unknown preset.
  return overrides[id] ?? PRESETS[preset]?.bindings[id] ?? BASE_BINDINGS[id] ?? [];
}

// FIX: the saved value was loaded as-is, so a stale preset id (after a downgrade) or a damaged override (not a list of
// bindings) made the store throw from then on. Keep only the parts of the saved value that have the right shape.
function isBinding(value: unknown): value is Binding {
  return !!value && typeof value === "object" && typeof (value as Binding).code === "string";
}

function sanitizeSaved(saved: unknown): Partial<KeybindsState> {
  if (!saved || typeof saved !== "object") return {};
  const { selectedPreset, overrides, cheatsheetSticky } = saved as Record<string, unknown>;
  const clean: Partial<KeybindsState> = {};
  if (typeof selectedPreset === "string" && selectedPreset in PRESETS) {
    clean.selectedPreset = selectedPreset as PresetId;
  }
  if (overrides && typeof overrides === "object") {
    clean.overrides = Object.fromEntries(
      Object.entries(overrides).filter(
        ([, bindings]) => Array.isArray(bindings) && bindings.every(isBinding),
      ),
    ) as Record<ActionId, Binding[]>;
  }
  if (typeof cheatsheetSticky === "boolean") clean.cheatsheetSticky = cheatsheetSticky;
  return clean;
}

export const useKeybindsStore = create<KeybindsState>()(
  persist(
    (set, get) => ({
      selectedPreset: DEFAULT_PRESET,
      overrides: {},
      isRecording: false,
      cheatsheetSticky: false,

      setPreset: (preset) => set({ selectedPreset: preset }),

      setCheatsheetSticky: (cheatsheetSticky) => set({ cheatsheetSticky }),

      setBinding: (id, bindings) =>
        set((s) => ({ overrides: { ...s.overrides, [id]: bindings } })),

      resetAction: (id) =>
        set((s) => {
          const next = { ...s.overrides };
          delete next[id];
          return { overrides: next };
        }),

      resetSurface: (surface) =>
        set((s) => ({
          overrides: Object.fromEntries(
            Object.entries(s.overrides).filter(
              ([id]) => ACTIONS[id as ActionId]?.surface !== surface,
            ),
          ) as Record<ActionId, Binding[]>,
        })),

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
          if (other.id === id) continue;
          // Same-surface bindings conflict; global bindings fire on EVERY
          // surface, so they conflict across the board in both directions.
          const sameSurface = other.surface === action.surface;
          const involvesGlobal =
            action.surface === "global" || other.surface === "global";
          if (!sameSurface && !involvesGlobal) continue;
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
      merge: (saved, current) => ({ ...current, ...sanitizeSaved(saved) }),
      partialize: (s) => ({
        selectedPreset: s.selectedPreset,
        overrides: s.overrides,
        cheatsheetSticky: s.cheatsheetSticky,
      }),
    },
  ),
);
